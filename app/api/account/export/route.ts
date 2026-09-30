import { NextResponse } from 'next/server';
import { exportDecisions } from '@/db/queries';
import { requireUser } from '@/lib/require-user';

export async function GET(request: Request) {
  const { user, response } = await requireUser(request);
  if (response || !user) return response;
  try {
    const decisions = await exportDecisions(user.id);
    return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), decisions }, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="or-my-decisions.json"',
        'cache-control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Your data could not be exported right now.' }, { status: 500 });
  }
}
