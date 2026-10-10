'use client';

import Link from '@/components/PageLink';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionCard } from '@/components/journal/DecisionCard';
import { fetchDecision, removeDecision, saveDecisionOutcome } from '@/lib/client-api';
import type { DecisionRecord, OutcomeRating } from '@/lib/types';

const outcomes: Array<{ value: OutcomeRating; label: string; note: string; satisfaction: number; regret: number }> = [
  { value: 'loved', label: 'Loved it', note: 'I would choose it again', satisfaction: 5, regret: 0 },
  { value: 'fine', label: 'Fine', note: 'It did the job', satisfaction: 3, regret: 1 },
  { value: 'regretted', label: 'Regretted it', note: 'I would choose differently', satisfaction: 1, regret: 5 },
];

export default function DecisionDetailPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<DecisionRecord | null>(null);
  const [rating, setRating] = useState<OutcomeRating | null>(null);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchDecision(params.id).then((decision) => {
      setRecord(decision); setRating(decision.outcome?.rating ?? null); setReflection(decision.outcome?.reflection ?? '');
    }).catch((caught) => setError(caught instanceof Error ? caught.message : 'This page could not be opened.')).finally(() => setLoading(false));
  }, [params.id]);

  async function submitOutcome() {
    if (!rating || !record) { setError('Choose how it turned out first.'); return; }
    const selected = outcomes.find((item) => item.value === rating)!;
    setSaving(true); setError('');
    try {
      setRecord(await saveDecisionOutcome(record.id, { rating, satisfaction: selected.satisfaction, regret: selected.regret, reflection }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The outcome could not be saved.'); }
    finally { setSaving(false); }
  }

  async function deleteEntry() {
    if (!record) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try { await removeDecision(record.id); window.location.assign('/diary'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The entry could not be deleted.'); setSaving(false); }
  }

  return (
    <AppShell compact>
      <div className="detail-back"><Link href="/diary">← Back to the diary</Link></div>
      {loading ? <div className="loading-page" role="status"><i /><span>Turning the page…</span></div> : error && !record ? (
        <section className="empty-paper"><span>Missing page</span><h2>This decision could not be found.</h2><p>{error}</p><Link className="secondary-button link-button" href="/diary">Return to diary</Link></section>
      ) : record && (
        <section className="detail-layout">
          <div className="detail-card-column"><DecisionCard record={record} featured exportable /></div>
          <article className="outcome-panel">
            <p className="mode-kicker">Outcome loop</p>
            <h1>How did it turn out?</h1>
            <p className="outcome-intro">This is how Or learns the difference between a good idea and a good decision for you.</p>
            <div className="outcome-choices">
              {outcomes.map((item) => (
                <button key={item.value} type="button" className={rating === item.value ? 'is-selected' : ''} onClick={() => setRating(item.value)}>
                  <i /><span><strong>{item.label}</strong><small>{item.note}</small></span>
                </button>
              ))}
            </div>
            <label className="reflection-input">
              <span>What would you want to remember?</span>
              <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Optional — one honest sentence is enough." rows={4} />
            </label>
            {error && <p className="feedback is-error" role="alert">{error}</p>}
            {record.outcome && !error && <p className="saved-outcome">✓ Outcome saved. This will shape similar decisions.</p>}
            <button className="choose-button wide-button" type="button" disabled={saving} onClick={() => void submitOutcome()}>{saving ? 'Saving…' : record.outcome ? 'Update outcome' : 'Save what happened'} <span>→</span></button>
            <div className="decision-evidence">
              <div><span>All options</span><p>{(record.options ?? [record.optionA, record.optionB]).join(" · ")}</p></div>
              {record.context && <div><span>Decision background</span><p style={{ whiteSpace: "pre-wrap" }}>{record.context}</p></div>}
              <div><span>Or recommended</span><strong>{record.recommendation}</strong></div>
              <div><span>You chose</span><strong>{record.finalChoice}</strong></div>
              <div><span>Why</span><p>{record.reason}</p></div>
            </div>
            <button className={`delete-button ${confirmDelete ? 'is-confirming' : ''}`} type="button" disabled={saving} onClick={() => void deleteEntry()}>{confirmDelete ? 'Delete this entry permanently' : 'Delete entry'}</button>
            {confirmDelete && <button className="text-button cancel-delete" type="button" onClick={() => setConfirmDelete(false)}>Keep it</button>}
          </article>
        </section>
      )}
    </AppShell>
  );
}
