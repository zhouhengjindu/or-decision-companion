import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) });
}
