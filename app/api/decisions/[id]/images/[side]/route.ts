import { NextResponse } from 'next/server';
import { getDecisionImage } from '@/db/queries';
import { requireUser } from '@/lib/require-user';

interface RouteContext { params: Promise<{ id: string; side: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const { id, side } = await context.params;
    const position = side === 'a' ? 0 : side === 'b' ? 1 : /^\d+$/.test(side) ? Number(side) : -1;
    if (!Number.isInteger(position) || position < 0 || position >= 10) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    const image = await getDecisionImage(id, user.id, position);
    if (!image) return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    return new Response(image, {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'The image could not be loaded.' }, { status: 500 });
  }
}
