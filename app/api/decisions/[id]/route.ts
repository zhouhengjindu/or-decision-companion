import { NextResponse } from 'next/server';
import { deleteDecision, getDecision, saveOutcome } from '@/db/queries';
import type { OutcomeRating } from '@/lib/types';
import { requireUser } from '@/lib/require-user';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const { id } = await context.params;
    const decision = await getDecision(id, user.id);
    return decision ? NextResponse.json({ decision }) : NextResponse.json({ error: 'Decision not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Unable to load this decision right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const { id } = await context.params;
    const payload = await request.json() as { rating: OutcomeRating; satisfaction: number; regret: number; reflection?: string };
    if (!['loved', 'fine', 'regretted'].includes(payload.rating)) {
      return NextResponse.json({ error: 'Choose an outcome first.' }, { status: 400 });
    }
    if (!Number.isInteger(payload.satisfaction) || payload.satisfaction < 1 || payload.satisfaction > 5 ||
      !Number.isInteger(payload.regret) || payload.regret < 0 || payload.regret > 5 ||
      (payload.reflection !== undefined && (typeof payload.reflection !== 'string' || payload.reflection.length > 2000))) {
      return NextResponse.json({ error: 'Some outcome fields are invalid.' }, { status: 400 });
    }
    const decision = await saveOutcome(id, user.id, payload);
    return decision ? NextResponse.json({ decision }) : NextResponse.json({ error: 'Decision not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Unable to save the outcome right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const { id } = await context.params;
    const deleted = await deleteDecision(id, user.id);
    if (!deleted) return NextResponse.json({ error: 'Decision not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete this decision right now.' }, { status: 500 });
  }
}
