import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { COOKIE_NAME, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('alumni_accounts')
      .select('id,email,password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, data.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSessionToken({ accountId: data.id, email: data.email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error('login', err);
    return NextResponse.json({ error: 'Server is not configured for login' }, { status: 500 });
  }
}
