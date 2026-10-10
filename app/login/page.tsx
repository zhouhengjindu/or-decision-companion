'use client';

import Link from '@/components/PageLink';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasGithub, setHasGithub] = useState(true);

  useEffect(() => {
    fetch('/api/auth/providers').then((response) => response.json()).then((value) => {
      const providers = value as Record<string, unknown>;
      setHasGithub(Boolean(providers.github));
    }).catch(() => setHasGithub(false));
  }, []);

  async function signIn() {
    setBusy(true); setError('');
    const { error: signInError } = await authClient.signIn.social({
      provider: 'github',
      callbackURL: `${window.location.origin}/auth/complete`,
    });
    if (signInError) setError(signInError.message ?? 'GitHub sign in could not start.');
    setBusy(false);
  }

  return (
    <main className="site-shell app-page">
      <section className="empty-paper login-paper">
        <span>Private by account</span>
        <h1>Sign in to keep your decisions.</h1>
        <p>Your diary and insights are private to your account. Or does not request access to your GitHub repositories.</p>
        <button className="choose-button" type="button" disabled={!hasGithub || busy} onClick={() => void signIn()}>{busy ? 'Opening GitHub…' : 'Continue with GitHub'} <b>→</b></button>
        {!hasGithub && <p className="settings-status">GitHub sign in is not configured yet.</p>}
        {error && <p role="alert" className="feedback is-error">{error}</p>}
        <Link href="/" className="detail-back">Back to Or</Link>
      </section>
    </main>
  );
}
