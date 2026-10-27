import {
  applyPaymentAmounts,
  jubileeStatusFromPayment,
  type RegistrationPaymentStatus,
} from '@/lib/events/balance';
import { ensureRegistrationCode, type RegistrationCodeAdmin } from '@/lib/events/registration-code';
import { createAdminClient } from '@/lib/supabase-admin';

type MarkOpts = {
  registrationId: string;
  /** When true, settle full remaining balance (admin Mark paid). */
  settleFull?: boolean;
  /** Incremental payment (Razorpay verify). Ignored if settleFull. */
  paymentPaise?: number;
  razorpay?: {
    order_id?: string | null;
    payment_id?: string | null;
    signature?: string | null;
  };
};

/**
 * Apply payment or full settle; sync primary jubilee CTA.
 * Idempotent when razorpay_payment_id already matches.
 */
export async function applyRegistrationPayment(opts: MarkOpts): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
  payment_status?: RegistrationPaymentStatus;
  amount_paid_paise?: number;
  amount_due_paise?: number;
  registration_code?: string | null;
}> {
  const admin = createAdminClient();
  const { data: reg, error } = await admin
    .from('event_registrations')
    .select(
      'id,event_id,account_id,payment_status,total_cost_paise,amount_paid_paise,razorpay_payment_id'
    )
    .eq('id', opts.registrationId)
    .maybeSingle();

  if (error || !reg) {
    return { ok: false, status: 404, error: 'Registration not found' };
  }

  if (
    opts.razorpay?.payment_id &&
    reg.razorpay_payment_id &&
    reg.razorpay_payment_id === opts.razorpay.payment_id
  ) {
    const paid = Math.max(0, Number(reg.amount_paid_paise) || 0);
    const total = Math.max(0, Number(reg.total_cost_paise) || 0);
    const derived = applyPaymentAmounts(total, paid, 0);
    const registration_code = await ensureRegistrationCode(
      admin as unknown as RegistrationCodeAdmin,
      reg.id,
      derived.payment_status
    );
    return {
      ok: true,
      payment_status: derived.payment_status,
      amount_paid_paise: derived.amount_paid_paise,
      amount_due_paise: derived.amount_due_paise,
      registration_code,
    };
  }

  const total = Math.max(0, Number(reg.total_cost_paise) || 0);
  const paid = Math.max(0, Number(reg.amount_paid_paise) || 0);
  const add = opts.settleFull
    ? Math.max(0, total - paid)
    : Math.max(0, Math.floor(Number(opts.paymentPaise) || 0));
  const next = applyPaymentAmounts(total, paid, add);

  const patch: Record<string, unknown> = {
    amount_paid_paise: next.amount_paid_paise,
    payment_status: next.payment_status,
    updated_at: new Date().toISOString(),
  };
  if (opts.razorpay?.order_id) patch.razorpay_order_id = opts.razorpay.order_id;
  if (opts.razorpay?.payment_id) patch.razorpay_payment_id = opts.razorpay.payment_id;
  if (opts.razorpay?.signature) patch.razorpay_signature = opts.razorpay.signature;

  const { error: updError } = await admin
    .from('event_registrations')
    .update(patch)
    .eq('id', reg.id);
  if (updError) {
    console.error('mark-paid update', updError);
    return { ok: false, status: 500, error: 'Could not update payment status' };
  }

  const { data: event } = await admin
    .from('event_catalog')
    .select('is_primary')
    .eq('id', reg.event_id)
    .maybeSingle();

  if (event?.is_primary) {
    const { error: statusError } = await admin
      .from('alumni_accounts')
      .update({
        jubilee_reg_status: jubileeStatusFromPayment(next.payment_status),
      })
      .eq('id', reg.account_id);
    if (statusError) console.error('mark-paid account status', statusError);
  }

  const registration_code = await ensureRegistrationCode(
    admin as unknown as RegistrationCodeAdmin,
    reg.id,
    next.payment_status
  );

  return {
    ok: true,
    payment_status: next.payment_status,
    amount_paid_paise: next.amount_paid_paise,
    amount_due_paise: next.amount_due_paise,
    registration_code,
  };
}

/** Admin Mark unpaid — clears paid amount. */
export async function markRegistrationUnpaid(registrationId: string): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const admin = createAdminClient();
  const { data: reg, error } = await admin
    .from('event_registrations')
    .select('id,event_id,account_id')
    .eq('id', registrationId)
    .maybeSingle();

  if (error || !reg) {
    return { ok: false, status: 404, error: 'Registration not found' };
  }

  const { error: updError } = await admin
    .from('event_registrations')
    .update({
      payment_status: 'pending',
      amount_paid_paise: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reg.id);
  if (updError) {
    return { ok: false, status: 500, error: 'Could not update payment status' };
  }

  const { data: event } = await admin
    .from('event_catalog')
    .select('is_primary')
    .eq('id', reg.event_id)
    .maybeSingle();

  if (event?.is_primary) {
    const { error: statusError } = await admin
      .from('alumni_accounts')
      .update({ jubilee_reg_status: 'pending_payment' })
      .eq('id', reg.account_id);
    if (statusError) console.error('mark-unpaid account status', statusError);
  }

  return { ok: true };
}
