import { NextResponse } from 'next/server';
import { requireVerifiedAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const me = await requireVerifiedAdmin();
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();

  const pendingMembers = await admin
    .from('alumni_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('member_status', 'pending');

  let publishedEvents = 0;
  let unpaidRegistrations = 0;

  // Prefer a real select — head-only counts can look "ok" when the table is missing.
  const events = await admin.from('event_catalog').select('id').eq('published', true);
  const catalogReady = !events.error;
  if (catalogReady) publishedEvents = (events.data || []).length;

  const regs = await admin
    .from('event_registrations')
    .select('id')
    .in('payment_status', ['pending', 'partial']);
  if (!regs.error) unpaidRegistrations = (regs.data || []).length;

  return NextResponse.json({
    pendingMembers: pendingMembers.count || 0,
    publishedEvents,
    unpaidRegistrations,
    catalogReady,
  });
}
