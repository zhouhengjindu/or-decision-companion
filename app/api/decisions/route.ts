import { NextResponse } from 'next/server';
import { clearDecisions, createDecision, listDecisions, type CreateDecisionPayload } from '@/db/queries';
import { requireUser } from '@/lib/require-user';

export async function GET(request: Request) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    return NextResponse.json({ decisions: await listDecisions(user.id) });
  } catch {
    return NextResponse.json({ error: 'Unable to load decisions right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const payload = await request.json() as CreateDecisionPayload;
    const options = payload.options ?? [payload.optionA, payload.optionB];
    if (!Array.isArray(options) || options.length < 2 || options.length > 10 || options.some((option) => typeof option !== 'string' || !option.trim() || option.length > 500)) {
      return NextResponse.json({ error: 'Provide between 2 and 10 non-empty options, each under 500 characters.' }, { status: 400 });
    }
    if (new Set(options.map((option) => option.trim().toLowerCase())).size !== options.length) {
      return NextResponse.json({ error: 'Make each option distinct.' }, { status: 400 });
    }
    payload.optionA = options[0]; payload.optionB = options[1];
    if (payload.images !== undefined && (!Array.isArray(payload.images) || payload.images.length !== options.length || payload.images.some((image) => image !== null && (typeof image !== 'string' || image.length > 2_000_000 || !image.startsWith('data:image/jpeg;base64,'))))) {
      return NextResponse.json({ error: 'Provide one compressed JPEG or null per option.' }, { status: 400 });
    }
    if (payload.optionA.length > 500 || payload.optionB.length > 500 || (payload.context?.length ?? 0) > 2000 ||
      (payload.reflection?.length ?? 0) > 2000 || payload.question?.length > 6000 || payload.reason?.length > 2000 ||
      payload.tradeoff?.length > 2000 || payload.regretEstimate?.length > 2000 ||
      (typeof payload.imageA === 'string' && payload.imageA.length > 2_000_000) ||
      (typeof payload.imageB === 'string' && payload.imageB.length > 2_000_000)) {
      return NextResponse.json({ error: 'Some decision fields are too long.' }, { status: 400 });
    }
    if (!['fast', 'think', 'deep'].includes(payload.mode) ||
      !['daily', 'food', 'social', 'study', 'work', 'purchase', 'travel', 'career', 'wellbeing'].includes(payload.category) ||
      (!Number.isInteger(payload.recommendationIndex) || payload.recommendationIndex < 0 || payload.recommendationIndex >= options.length) || (!Number.isInteger(payload.finalChoiceIndex) || payload.finalChoiceIndex < 0 || payload.finalChoiceIndex >= options.length) ||
      typeof payload.reversible !== 'boolean' || typeof payload.accepted !== 'boolean' ||
      !Number.isInteger(payload.confidence) || payload.confidence < 0 || payload.confidence > 100 ||
      !Number.isInteger(payload.durationSeconds) || payload.durationSeconds < 0 || payload.durationSeconds > 86400 ||
      typeof payload.question !== 'string' || typeof payload.reflection !== 'string' || typeof payload.reason !== 'string' ||
      typeof payload.tradeoff !== 'string' || typeof payload.regretEstimate !== 'string' ||
      (payload.context !== undefined && typeof payload.context !== 'string') ||
      (payload.mood !== undefined && (typeof payload.mood !== 'string' || payload.mood.length > 40)) ||
      (payload.imageA !== undefined && payload.imageA !== null && typeof payload.imageA !== 'string') ||
      (payload.imageB !== undefined && payload.imageB !== null && typeof payload.imageB !== 'string')) {
      return NextResponse.json({ error: 'Some decision fields are invalid.' }, { status: 400 });
    }
    if ((payload.imageA && !payload.imageA.startsWith('data:image/jpeg;base64,')) || (payload.imageB && !payload.imageB.startsWith('data:image/jpeg;base64,'))) {
      return NextResponse.json({ error: 'Images must use the compressed JPEG format.' }, { status: 400 });
    }
    const decision = await createDecision(user.id, { ...payload, optionA: payload.optionA.trim(), optionB: payload.optionB.trim(), options: options.map((option) => option.trim()) });
    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Each image')) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    if (error instanceof Error && error.message.startsWith('Your account')) return NextResponse.json({ error: error.message }, { status: 429 });
    return NextResponse.json({ error: 'Unable to save this decision right now.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    await clearDecisions(user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to clear decisions right now.' }, { status: 500 });
  }
}
