'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAmbientAudio, type SoundScene } from '@/components/audio/AmbientAudioProvider';
import { clearAllDecisions } from '@/lib/client-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const scenes: Array<{ id: SoundScene; title: string; note: string }> = [
  { id: 'focus', title: 'Focus', note: 'A clean, low hum' },
  { id: 'dream', title: 'Dream', note: 'Soft and a little open' },
  { id: 'night', title: 'Night', note: 'Low, warm, and slow' },
];

export default function SettingsPage() {
  const { scene, setScene, supported } = useAmbientAudio();
  const router = useRouter();
  const [confirmClear, setConfirmClear] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [accountStatus, setAccountStatus] = useState('');

  async function clearData() {
    if (!confirmClear) { setConfirmClear(true); return; }
    setStatus('Clearing…');
    try { await clearAllDecisions(); setStatus('Your decision history has been cleared.'); setConfirmClear(false); }
    catch (caught) { setStatus(caught instanceof Error ? caught.message : 'The history could not be cleared.'); }
  }

  async function deleteAccount() {
    if (!confirmDeleteAccount) { setConfirmDeleteAccount(true); return; }
    setAccountStatus('Deleting account…');
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation: deletePhrase }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'The account could not be deleted.');
      router.push('/');
    } catch (caught) { setAccountStatus(caught instanceof Error ? caught.message : 'The account could not be deleted.'); }
  }

  return (
    <AppShell compact>
      <section className="page-heading settings-heading"><p className="eyebrow"><span /> Your space</p><h1>Settings</h1><p>Your account controls your private Or data.</p></section>
      <div className="settings-layout">
        <section className="settings-section">
          <div><span className="section-label">Ambient sound</span><p>Generated in your browser. No music files, no tracking.</p></div>
          <div className="scene-picker" aria-label="Sound scene">
            {scenes.map((item) => <button key={item.id} type="button" disabled={!supported} aria-pressed={scene === item.id} className={scene === item.id ? 'is-selected' : ''} onClick={() => setScene(item.id)}><i /><span><strong>{item.title}</strong><small>{item.note}</small></span></button>)}
          </div>
        </section>
        <section className="settings-section">
          <div><span className="section-label">Account memory</span><p>Only your signed-in account can read or change your decisions.</p></div>
          <div className="privacy-sheet"><strong>Private to your account</strong><p>Or stores your decisions in its Cloudflare database. Sign out on shared devices and clear your history whenever you like.</p><Link href="/privacy">Read the privacy details →</Link></div>
        </section>
        <section className="settings-section danger-section">
          <div><span className="section-label">Start over</span><p>Delete every decision, outcome, and learned pattern in your account.</p></div>
          <div><button className={confirmClear ? 'danger-button is-confirming' : 'danger-button'} type="button" onClick={() => void clearData()}>{confirmClear ? 'Delete everything permanently' : 'Clear my history'}</button>{confirmClear && <button className="text-button" type="button" onClick={() => setConfirmClear(false)}>Keep my history</button>}{status && <p className="settings-status" role="status">{status}</p>}</div>
        </section>
        <section className="settings-section danger-section">
          <div><span className="section-label">Account data</span><p>Download or permanently delete the data connected to your account.</p></div>
          <div className="account-actions">
            <Link className="secondary-button link-button" href="/api/account/export">Download my data</Link>
            <button className="danger-button" type="button" disabled={confirmDeleteAccount && deletePhrase !== 'DELETE MY ACCOUNT'} onClick={() => void deleteAccount()}>{confirmDeleteAccount ? 'Permanently delete account' : 'Delete my account'}</button>
            {confirmDeleteAccount && <>
              <label className="reflection-input"><span>Type DELETE MY ACCOUNT to confirm</span><input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} autoComplete="off" /></label>
              <button className="text-button" type="button" onClick={() => { setConfirmDeleteAccount(false); setDeletePhrase(''); }}>Keep my account</button>
            </>}
            {accountStatus && <p className="settings-status" role="status">{accountStatus}</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
