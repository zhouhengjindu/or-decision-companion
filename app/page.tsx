'use client';

import { AppShell } from '@/components/AppShell';
import { DecisionExperience } from '@/components/decision/DecisionExperience';

export default function Home() {
  return (
    <AppShell>
      <DecisionExperience />
      <aside className="margin-note" aria-label="Or note">
        <span>Or says</span>
        <p>Reversible decisions deserve less of your day.</p>
      </aside>
      <div className="page-number" aria-hidden="true">01 / today</div>
    </AppShell>
  );
}
