import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '@/lib/firebaseAdmin';
import { checkCsrf } from '@/lib/utils/csrf';

export async function POST(request: Request) {
  // CSRF guard
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { idToken, role } = await request.json();

    if (!idToken || !role) {
      return NextResponse.json({ error: 'Missing idToken or role' }, { status: 400 });
    }

    let auth;
    try {
      auth = getFirebaseAdminAuth();
    } catch {
      // Admin SDK not configured — hard-fail rather than fall back to a fake session.
      console.error('[sessionLogin] Firebase Admin SDK not initialised. Check server environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = await auth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'ok', uid: decoded.uid });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      path: '/',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
    });

    // role cookie must be httpOnly so JS cannot be used to forge it client-side.
    // The middleware reads it server-side, so httpOnly is safe.
    response.cookies.set('role', role, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
    });

    return response;
  } catch (error) {
    console.error('[sessionLogin] error', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
