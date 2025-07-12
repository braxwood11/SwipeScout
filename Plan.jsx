// src/pages/Plan.jsx
import {useEffect, useState} from 'react';
import {createEnhancedDraftPlan} from '../utils/enhancedDraftPlan.jsx';

export default function Plan() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/players.json').then(r=>r.json()),
      JSON.parse(localStorage.getItem('draftswipe_prefs_v1')||'{}')
    ]).then(([players, prefs]) => {
      setPlan(createEnhancedDraftPlan(players, prefs));
    });
  }, []);

  if (!plan) return <p>Building plan…</p>;

  return (
    <div className="p-4 space-y-8 text-neutral-100">
      <h1 className="text-2xl font-bold">Your Tier Board</h1>
      {plan.tiers.map((tier,i)=>
        <div key={i} className="mb-2">
          <h2 className="font-semibold">Tier {i+1}</h2>
          <ul className="list-disc ml-5">
            {tier.map(p=> <li key={p.ID}>{p.Name} – {p.Pos} (ADP {p.ADP})</li>)}
          </ul>
        </div>
      )}

      <h1 className="text-2xl font-bold">Round Targets</h1>
      {plan.rounds.map((r,i)=>
        r.length ? (
          <p key={i}><strong>Round {i+1}:</strong> {r.map(p=>p.Name).join(', ')}</p>
        ) : null
      )}
    </div>
  );
}
