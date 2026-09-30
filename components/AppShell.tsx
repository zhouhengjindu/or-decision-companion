'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAmbientAudio } from '@/components/audio/AmbientAudioProvider';
import { useEffect, useState, type ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';

const navigation = [
  { href: '/', label: 'Decide' },
  { href: '/diary', label: 'Diary' },
  { href: '/insights', label: 'Insights' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const pathname = usePathname();
  const { soundOn, supported, pendingResume, toggle } = useAmbientAudio();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    authClient.getSession().then(({ data }) => setUser(data?.user ?? null)).catch(() => undefined);
  }, []);

  async function signOut() {
    await authClient.signOut();
    setUser(null);
  }

  return (
    <main className={compact ? 'site-shell app-page' : 'site-shell'}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Or home">Or<span className="wordmark-dot">.</span></Link>
        <nav className="nav-links" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} className={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'is-active' : ''} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-actions">
          {user ? <button className="login-link" type="button" onClick={() => void signOut()}>Sign out</button> : <Link className="login-link" href={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link>}
          <button className="sound-toggle" type="button" aria-pressed={soundOn} onClick={toggle} disabled={!supported}>
            <span className={soundOn ? 'sound-glyph is-on' : 'sound-glyph'} aria-hidden="true"><i /><i /><i /></span>
            {!supported ? 'No sound' : pendingResume ? 'Sound ready' : `Sound ${soundOn ? 'on' : 'off'}`}
          </button>
        </div>
      </header>
      {children}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <Link key={item.href} className={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)) ? 'is-active' : ''} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
