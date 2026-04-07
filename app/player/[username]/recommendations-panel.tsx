'use client';

import { useState } from 'react';
import { Recommendation, RecommendationCategory, GameStage } from '@/lib/types/player';

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  general:     'General',
  farming:     'Farming',
  mining:      'Mining',
  dungeons:    'Dungeons',
  slayer:      'Slayer',
  fishing:     'Fishing',
  accessories: 'Accessories',
  skills:      'Skills',
  combat:      'Combat',
  money:       'Money',
};

const PLANNER_PATHS: Partial<Record<RecommendationCategory, string>> = {
  farming:     'farming',
  mining:      'mining',
  dungeons:    'dungeons',
  slayer:      'slayer',
  fishing:     'fishing',
  accessories: 'accessories',
  money:       'money',
};

type Filter = 'all' | 'cheapest' | 'best_roi' | 'fastest' | 'blocker' | 'progression' | 'longterm' | GameStage | RecommendationCategory;

const STAGE_KEYS = new Set<string>(['early', 'mid', 'late', 'endgame']);

interface Props {
  recs: Recommendation[];
  username: string;
}

export default function RecommendationsPanel({ recs, username }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categories = [...new Set(recs.map(r => r.category))].sort() as RecommendationCategory[];

  const filtered = recs.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'cheapest') return r.type === 'cheapest' || (r.estimatedCost !== null && r.estimatedCost < 500_000);
    if (filter === 'best_roi') return r.type === 'best_roi' || r.roiScore >= 60;
    if (filter === 'fastest') return r.type === 'fastest';
    if (filter === 'blocker')     return r.type === 'blocker' || r.priority === 'critical';
    if (filter === 'progression') return r.type === 'progression' || r.progressionScore >= 70;
    if (filter === 'longterm')    return r.type === 'longterm';
    if (STAGE_KEYS.has(filter)) return r.gameStage.includes(filter as GameStage);
    return r.category === filter;
  });

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const tabs: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'all',      label: 'All',      count: recs.length },
    { key: 'cheapest', label: 'Cheapest', count: recs.filter(r => r.type === 'cheapest' || (r.estimatedCost !== null && r.estimatedCost < 500_000)).length },
    { key: 'best_roi', label: 'Best ROI', count: recs.filter(r => r.type === 'best_roi' || r.roiScore >= 60).length },
    { key: 'fastest',  label: 'Fastest',  count: recs.filter(r => r.type === 'fastest').length },
    { key: 'blocker',     label: 'Blockers',    count: recs.filter(r => r.type === 'blocker' || r.priority === 'critical').length },
    { key: 'progression', label: 'Progression', count: recs.filter(r => r.type === 'progression' || r.progressionScore >= 70).length },
    { key: 'longterm',    label: 'Long-term',   count: recs.filter(r => r.type === 'longterm').length },
    { key: 'early'   as Filter, label: 'Early',   count: recs.filter(r => r.gameStage.includes('early')).length },
    { key: 'mid'     as Filter, label: 'Mid',      count: recs.filter(r => r.gameStage.includes('mid')).length },
    { key: 'late'    as Filter, label: 'Late',     count: recs.filter(r => r.gameStage.includes('late')).length },
    { key: 'endgame' as Filter, label: 'Endgame',  count: recs.filter(r => r.gameStage.includes('endgame')).length },
    ...categories.map(c => ({
      key: c as Filter,
      label: CATEGORY_LABELS[c],
      count: recs.filter(r => r.category === c).length,
    })),
  ];

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-white mb-3">All Recommendations</h2>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 ${filter === tab.key ? 'text-indigo-200' : 'text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No recommendations in this category.</p>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 12).map(r => {
            const isExpanded = expanded.has(r.id);
            const plannerPath = PLANNER_PATHS[r.category];
            return (
              <div
                key={r.id}
                className="rounded-lg border border-white/5 bg-slate-800/40 p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <span className={`mt-0.5 shrink-0 text-xs ${
                    r.priority === 'critical' ? 'text-red-400' :
                    r.priority === 'high'     ? 'text-orange-400' :
                    r.priority === 'medium'   ? 'text-yellow-400' :
                    'text-slate-500'
                  }`}>●</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{r.title}</span>
                      <span className="text-xs text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
                        {CATEGORY_LABELS[r.category]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{r.description}</p>

                    {/* Mini stats row */}
                    <div className="flex flex-wrap gap-3 text-xs mb-1">
                      {r.estimatedCost !== null && (
                        <span className="text-yellow-300">
                          💰 {r.estimatedCostLabel || (r.estimatedCost === 0 ? 'Free' : formatCoinsCompact(r.estimatedCost))}
                        </span>
                      )}
                      {r.estimatedBenefit && (
                        <span className="text-emerald-400">↑ {r.estimatedBenefit}</span>
                      )}
                      {r.roiScore > 0 && (
                        <span className="text-slate-500">ROI {r.roiScore}/100</span>
                      )}
                    </div>

                    {/* ROI + Urgency bars */}
                    <div className="flex gap-3 mb-1.5">
                      <MiniBar label="ROI" value={r.roiScore} color="bg-emerald-500" />
                      <MiniBar label="Urgency" value={r.urgencyScore} color="bg-orange-500" />
                    </div>

                    {/* Expandable "Why it matters" */}
                    {(r.whyItMatters || r.unlocks.length > 0 || r.dependsOn.length > 0) && (
                      <button
                        onClick={() => toggleExpanded(r.id)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {isExpanded ? '▲ Hide details' : '▼ Details'}
                      </button>
                    )}
                    {isExpanded && (
                      <div className="mt-2 text-xs text-slate-400 bg-slate-900/50 rounded p-2 border border-white/5 space-y-1.5">
                        {r.whyItMatters && <p>{r.whyItMatters}</p>}
                        {r.dependsOn.length > 0 && (
                          <p className="text-slate-500">
                            <span className="text-slate-400 font-medium">Requires: </span>
                            {r.dependsOn.join(', ')}
                          </p>
                        )}
                        {r.unlocks.length > 0 && (
                          <p className="text-slate-500">
                            <span className="text-emerald-600 font-medium">Unlocks: </span>
                            {r.unlocks.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* View in Planner button */}
                  {plannerPath && (
                    <a
                      href={`/player/${username}/${plannerPath}`}
                      className="shrink-0 text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
                      title={`Open ${CATEGORY_LABELS[r.category]} planner`}
                    >
                      Open →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length > 12 && (
            <p className="text-xs text-slate-600 text-center pt-1">
              +{filtered.length - 12} more — use category filters to narrow down
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-slate-600 text-xs w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function formatCoinsCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}
