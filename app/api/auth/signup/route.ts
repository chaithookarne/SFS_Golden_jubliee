import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { COOKIE_NAME, createSessionToken, sessionCookieOptions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const phoneNumber = String(body.phoneNumber || '').trim();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('alumni_accounts')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone_number: phoneNumber || null,
        role: 'alumni',
        member_status: 'pending',
      })
      .select('id,email')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      console.error('signup insert', error);
      return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
    }

    const token = await createSessionToken({ accountId: data.id, email: data.email });
    const res = NextResponse.json({ ok: true }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error('signup', err);
    return NextResponse.json({ error: 'Server is not configured for signup' }, { status: 500 });
  }
}
