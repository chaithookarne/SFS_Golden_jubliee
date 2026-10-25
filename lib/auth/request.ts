import { cookies } from 'next/headers';
import { COOKIE_NAME, verifySessionToken, type SessionPayload } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase-admin';

export type AlumniAccount = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: 'alumni' | 'admin';
  member_status: 'pending' | 'verified' | 'rejected' | 'suspended';
};

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentAccount(): Promise<AlumniAccount | null> {
  const session = await getSession();
  if (!session) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('alumni_accounts')
    .select('id,email,full_name,phone_number,role,member_status')
    .eq('id', session.accountId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AlumniAccount;
}
