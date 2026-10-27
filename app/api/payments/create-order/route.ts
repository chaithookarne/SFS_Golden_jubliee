import { NextResponse } from 'next/server';
import { getCurrentAccount } from '@/lib/auth/request';
import { amountDuePaise, OPEN_PAYMENT_STATUSES } from '@/lib/events/balance';
import { repriceEventRegistrations } from '@/lib/events/reprice';
import { applyRegistrationPayment } from '@/lib/events/mark-paid';
import {
  getRazorpayClient,
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayKeysAligned,
} from '@/lib/payments/razorpay';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const me = await getCurrentAccount();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (me.role === 'admin') {
    return NextResponse.json({ error: 'Committee accounts do not pay here' }, { status: 400 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      {
        error: 'Payments are not configured yet. Ask the committee to mark your payment, or try again later.',
        configured: false,
      },
      { status: 503 }
    );
  }

  if (!razorpayKeysAligned()) {
    return NextResponse.json(
      {
        error:
          'Payment keys mismatch: NEXT_PUBLIC_RAZORPAY_KEY_ID must equal RAZORPAY_KEY_ID (same test or live key).',
        configured: false,
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const registrationId = String(body.registrationId || '').trim();
  if (!registrationId) {
    return NextResponse.json({ error: 'registrationId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: reg, error } = await admin
    .from('event_registrations')
    .select('id,event_id,account_id,payment_status,total_cost_paise,amount_paid_paise')
    .eq('id', registrationId)
    .eq('account_id', me.id)
    .in('payment_status', [...OPEN_PAYMENT_STATUSES])
    .maybeSingle();

  if (error || !reg) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  await repriceEventRegistrations(String(reg.event_id || ''));
  const { data: priced } = await admin
    .from('event_registrations')
    .select('id,total_cost_paise,amount_paid_paise,payment_status')
    .eq('id', reg.id)
    .maybeSingle();
  const current = priced || reg;

  const total = Math.max(0, Number(current.total_cost_paise) || 0);
  const paid = Math.max(0, Number(current.amount_paid_paise) || 0);
  const due = amountDuePaise(total, paid);

  if (due === 0) {
    const settled = await applyRegistrationPayment({
      registrationId: reg.id,
      settleFull: true,
    });
    return NextResponse.json({
      ok: true,
      amount_due_paise: 0,
      payment_status: settled.payment_status || 'paid',
      registration_code: settled.registration_code || null,
      skipCheckout: true,
    });
  }

  if (due < 100) {
    return NextResponse.json(
      { error: 'Amount due must be at least ₹1 to pay online' },
      { status: 400 }
    );
  }

  const client = getRazorpayClient();
  if (!client) {
    return NextResponse.json({ error: 'Payments are not configured', configured: false }, { status: 503 });
  }

  try {
    const order = await client.orders.create({
      amount: due,
      currency: 'INR',
      receipt: `reg_${reg.id.slice(0, 8)}_${Date.now()}`.slice(0, 40),
      notes: {
        registration_id: reg.id,
        account_id: me.id,
      },
    });

    const { error: updError } = await admin
      .from('event_registrations')
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.id);

    if (updError) {
      console.error('create-order persist', updError);
      return NextResponse.json({ error: 'Could not save payment order' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: due,
      currency: 'INR',
      keyId: razorpayKeyId(),
      name: me.full_name,
      email: me.email,
      contact: me.phone_number,
    });
  } catch (err) {
    console.error('razorpay order', err);
    const statusCode =
      err && typeof err === 'object' && 'statusCode' in err
        ? Number((err as { statusCode?: unknown }).statusCode)
        : NaN;
    if (statusCode === 401) {
      return NextResponse.json(
        {
          error:
            'Payment gateway authentication failed. In Razorpay Dashboard (Test Mode) regenerate API keys, then set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID to the new pair in Vercel and redeploy.',
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: 'Could not create payment order' }, { status: 500 });
  }
}
