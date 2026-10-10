'use client';

import Link from '@/components/PageLink';
import { useState } from 'react';
import { downloadDecisionCard } from '@/lib/decision-card';
import type { DecisionRecord } from '@/lib/types';

export function DecisionCard({ record, featured = false, exportable = false }: { record: DecisionRecord; featured?: boolean; exportable?: boolean }) {
  const [exportState, setExportState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const date = new Date(record.createdAt);
  const body = (
    <article className={`journal-card ${featured ? 'is-featured' : ''}`}>
      <div className="journal-card-topline">
        <span>{date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
        <span>{record.mode} Or</span>
      </div>
      {(record.images ?? [record.imageA, record.imageB]).some(Boolean) && (
        <div className="card-photo-pair" aria-label="Decision photos">
          {(record.images ?? [record.imageA, record.imageB]).map((image, index) => image ? <img key={index} src={image} alt={(record.options ?? [record.optionA, record.optionB])[index]} /> : null)}
        </div>
      )}
      <p className="journal-question">{record.question}</p>
      <div className="journal-choice"><small>You chose</small><strong>{record.finalChoice}</strong></div>
      <p className="journal-reflection">“{record.reflection || record.reason}”</p>
      <div className="journal-card-bottom">
        <span className={`outcome-dot ${record.outcome?.rating ?? 'pending'}`} />
        <span>{record.outcome ? record.outcome.rating : 'Outcome waiting'}</span>
        <span className="journal-mood">{record.mood}</span>
      </div>
    </article>
  );

  if (exportable) {
    return (
      <div className="exportable-card">
        {body}
        <div className="card-actions">
          <button type="button" className="text-button" onClick={async () => {
            try {
              setExportState('working');
              await downloadDecisionCard(record);
              setExportState('done');
            } catch { setExportState('error'); }
          }}>
            {exportState === 'working' ? 'Making card…' : exportState === 'done' ? 'Card saved' : exportState === 'error' ? 'Try again' : 'Save journal card'}
          </button>
          <Link className="text-button" href={`/diary/${record.id}`}>Open entry →</Link>
        </div>
      </div>
    );
  }

  return <Link className="journal-card-link" href={`/diary/${record.id}`}>{body}</Link>;
}
