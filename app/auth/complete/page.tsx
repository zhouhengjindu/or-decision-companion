'use client';

import Link from '@/components/PageLink';
import { useEffect, useState } from 'react';
import { saveDecision } from '@/lib/client-api';
import type { CreateDecisionPayload } from '@/db/queries';

export default function AuthCompletePage() {
  const [message, setMessage] = useState('Finishing sign in…');
  const [savedId, setSavedId] = useState('');

  useEffect(() => {
    let active = true;
    async function finish() {
      const raw = sessionStorage.getItem('or-pending-decision');
      if (!raw) { setMessage('You are signed in. Your diary is ready.'); return; }
      try {
        const payload = JSON.parse(raw) as CreateDecisionPayload;
        const record = await saveDecision(payload);
        sessionStorage.removeItem('or-pending-decision');
        if (active) { setSavedId(record.id); setMessage('Your decision is saved in your private diary.'); }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Your decision could not be saved.');
      }
    }
    void finish();
    return () => { active = false; };
  }, []);

  return (
    <main className="site-shell app-page">
      <section className="empty-paper login-paper">
        <span>Welcome to Or</span><h1>{message}</h1>
        <p>Your saved decisions and outcomes belong to your account.</p>
        {savedId ? <Link className="choose-button link-button" href={`/diary/${savedId}`}>Open this decision <b>→</b></Link> : <Link className="choose-button link-button" href="/diary">Open my diary <b>→</b></Link>}
        <Link href="/" className="detail-back">Back to Or</Link>
      </section>
    </main>
  );
}
