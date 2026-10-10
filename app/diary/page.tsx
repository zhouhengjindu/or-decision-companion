'use client';

import Link from '@/components/PageLink';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionCard } from '@/components/journal/DecisionCard';
import { fetchDecisions } from '@/lib/client-api';
import type { DecisionRecord } from '@/lib/types';

type Filter = 'all' | 'waiting' | 'reviewed';

export default function DiaryPage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDecisions().then(setDecisions).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to open the diary.')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => decisions.filter((decision) => {
    if (filter === 'waiting') return !decision.outcome;
    if (filter === 'reviewed') return Boolean(decision.outcome);
    return true;
  }), [decisions, filter]);

  return (
    <AppShell compact>
      <section className="page-heading">
        <p className="eyebrow"><span /> Decision diary</p>
        <h1>My decisions</h1>
        <p>Your choices become useful when you can meet them again.</p>
      </section>

      <section className="diary-toolbar" aria-label="Diary filters">
        <div>
          {(['all', 'waiting', 'reviewed'] as Filter[]).map((item) => (
            <button key={item} className={filter === item ? 'is-active' : ''} type="button" onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <span>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
      </section>

      {loading ? <LoadingPage label="Opening your diary…" /> : error ? (
        <section className="empty-paper"><span>Memory paused</span><h2>Your diary could not open.</h2><p>{error}</p><button type="button" className="secondary-button" onClick={() => location.reload()}>Try again</button></section>
      ) : decisions.length === 0 ? (
        <section className="empty-paper">
          <span>First page</span><h2>Your diary is waiting for a decision.</h2>
          <p>Small choices count. Or will turn the next one into your first entry.</p>
          <Link className="choose-button link-button" href="/">Make a decision <b>→</b></Link>
        </section>
      ) : filtered.length === 0 ? (
        <section className="empty-paper"><span>No match</span><h2>Nothing in this part of the diary yet.</h2><button type="button" className="secondary-button" onClick={() => setFilter('all')}>Show every entry</button></section>
      ) : (
        <section className="diary-grid">
          {filtered.map((decision, index) => <div key={decision.id} style={{ '--card-order': index } as React.CSSProperties}><DecisionCard record={decision} /></div>)}
        </section>
      )}
    </AppShell>
  );
}

function LoadingPage({ label }: { label: string }) {
  return <div className="loading-page" role="status"><i /><span>{label}</span></div>;
}
