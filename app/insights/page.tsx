'use client';

import Link from '@/components/PageLink';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { fetchDecisions } from '@/lib/client-api';
import { computeInsights } from '@/lib/insights';
import type { DecisionRecord, InsightSummary } from '@/lib/types';

export default function InsightsPage() {
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDecisions().then((items) => { setHistory(items); setSummary(computeInsights(items)); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Insights are unavailable.')).finally(() => setLoading(false));
  }, []);

  const maxMode = summary ? Math.max(1, ...Object.values(summary.modeCounts)) : 1;
  const longest = [...history].sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 3);

  return (
    <AppShell compact>
      <section className="page-heading insight-heading">
        <p className="eyebrow"><span /> Personal decision model</p>
        <h1>A portrait in choices</h1>
        <p>Nothing here is guessed. Every line comes from decisions saved in your account.</p>
      </section>

      {loading ? <div className="loading-page" role="status"><i /><span>Finding the pattern…</span></div> : error ? (
        <section className="empty-paper"><span>Pattern paused</span><h2>Insights could not be calculated.</h2><p>{error}</p><button className="secondary-button" type="button" onClick={() => location.reload()}>Try again</button></section>
      ) : summary && summary.total === 0 ? (
        <section className="empty-paper"><span>No invented numbers</span><h2>Or needs real decisions before it can know you.</h2><p>Make two or three choices and return. The first pattern will appear here.</p><Link className="choose-button link-button" href="/">Start with one <b>→</b></Link></section>
      ) : summary && (
        <div className="insight-layout">
          <section className="insight-lead">
            <span className="section-label">What Or is learning</span>
            {summary.statements.map((statement, index) => <blockquote key={statement} className={index === 0 ? 'primary-insight' : ''}>{statement}</blockquote>)}
            <p className="sample-note">Based on {summary.total} decision{summary.total === 1 ? '' : 's'} and {summary.outcomeCount} outcome check-in{summary.outcomeCount === 1 ? '' : 's'}.</p>
          </section>

          <section className="decision-budget">
            <div className="section-heading-row"><span className="section-label">Decision budget · this week</span><strong>{summary.thisWeek}</strong></div>
            <div className="budget-grid">
              <article><strong>{summary.averageDuration}<small>s</small></strong><span>average deciding time</span></article>
              <article><strong>{summary.acceptanceRate}<small>%</small></strong><span>Or suggestions accepted</span></article>
              <article><strong>{summary.overthoughtReversible}</strong><span>reversible choices overthought</span></article>
            </div>
          </section>

          <section className="mode-patterns">
            <span className="section-label">How much space your choices need</span>
            {(['fast', 'think', 'deep'] as const).map((mode) => (
              <div className="mode-bar" key={mode}><span>{mode} Or</span><div><i style={{ width: `${(summary.modeCounts[mode] / maxMode) * 100}%` }} /></div><strong>{summary.modeCounts[mode]}</strong></div>
            ))}
          </section>

          <section className="outcome-summary">
            <span className="section-label">Outcomes so far</span>
            <div className="outcome-tally"><div><i className="loved" /><strong>{summary.lovedCount}</strong><span>Loved it</span></div><div><i className="fine" /><strong>{summary.outcomeCount - summary.lovedCount - summary.regrettedCount}</strong><span>Fine</span></div><div><i className="regretted" /><strong>{summary.regrettedCount}</strong><span>Regretted</span></div></div>
            {summary.outcomeCount < 2 && <p className="sample-note">Check in on one more decision to unlock outcome-based guidance.</p>}
          </section>

          <section className="longest-decisions">
            <span className="section-label">Where your attention went</span>
            {longest.map((record) => <Link key={record.id} href={`/diary/${record.id}`}><span>{record.question}</span><strong>{record.durationSeconds}s</strong></Link>)}
          </section>
        </div>
      )}
    </AppShell>
  );
}
