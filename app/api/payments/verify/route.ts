import { NextResponse } from 'next/server';
import { getCurrentAccount } from '@/lib/auth/request';
import { amountDuePaise, OPEN_PAYMENT_STATUSES } from '@/lib/events/balance';
import { applyRegistrationPayment } from '@/lib/events/mark-paid';
import { verifyCheckoutSignature } from '@/lib/payments/razorpay';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const me = await getCurrentAccount();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || '').trim();
  const paymentId = String(body.razorpay_payment_id || '').trim();
  const signature = String(body.razorpay_signature || '').trim();
  const registrationId = String(body.registrationId || '').trim();

  if (!orderId || !paymentId || !signature || !registrationId) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
  }

  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: reg, error } = await admin
    .from('event_registrations')
    .select('id,account_id,total_cost_paise,amount_paid_paise,razorpay_order_id')
    .eq('id', registrationId)
    .eq('account_id', me.id)
    .in('payment_status', [...OPEN_PAYMENT_STATUSES])
    .maybeSingle();

  if (error || !reg) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  if (reg.razorpay_order_id && reg.razorpay_order_id !== orderId) {
    return NextResponse.json({ error: 'Order does not match this registration' }, { status: 400 });
  }

  const due = amountDuePaise(
    Math.max(0, Number(reg.total_cost_paise) || 0),
    Math.max(0, Number(reg.amount_paid_paise) || 0)
  );

  const result = await applyRegistrationPayment({
    registrationId: reg.id,
    paymentPaise: due,
    razorpay: {
      order_id: orderId,
      payment_id: paymentId,
      signature,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'Could not confirm payment' },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    payment_status: result.payment_status,
    amount_paid_paise: result.amount_paid_paise,
    amount_due_paise: result.amount_due_paise,
    registration_code: result.registration_code || null,
  });
}
