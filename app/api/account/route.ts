import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureSchema, listDecisionImageKeys } from '@/db/queries';
import { requireUser } from '@/lib/require-user';

export async function DELETE(request: Request) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const payload = await request.json() as { confirmation?: string };
    if (payload.confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ error: 'Type the confirmation phrase to delete your account.' }, { status: 400 });
    }
    await ensureSchema();
    const imageKeys = await listDecisionImageKeys(user.id);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM outcomes WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(user.id),
      env.DB.prepare('DELETE FROM reflections WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(user.id),
      env.DB.prepare('DELETE FROM choices WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(user.id),
      env.DB.prepare('DELETE FROM recommendations WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(user.id),
      env.DB.prepare('DELETE FROM options WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(user.id),
      env.DB.prepare('DELETE FROM decisions WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM patterns WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM preferences WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM auth_accounts WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM auth_users WHERE id = ?').bind(user.id),
    ]);
    if (imageKeys.length && env.IMAGES) await env.IMAGES.delete(imageKeys);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Your account could not be deleted right now.' }, { status: 500 });
  }
}
