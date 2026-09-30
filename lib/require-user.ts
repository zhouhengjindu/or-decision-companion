import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function requireUser(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return { user: null, response: NextResponse.json({ error: 'Sign in to save and access your private decisions.' }, { status: 401 }) };
    return { user, response: null };
  } catch {
    return { user: null, response: NextResponse.json({ error: 'Authentication is temporarily unavailable.' }, { status: 503 }) };
  }
}
