'use client';

import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import { NewsCard } from '@/components/finance/NewsCard';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';
import type { NewsArticle } from '@/lib/finance/types';

const FINANCE_COLOR = '#10b981';

const TOPICS = [
  { label: 'Markets',     ticker: 'SPY' },
  { label: 'Tech',        ticker: 'QQQ' },
  { label: 'Energy',      ticker: 'XLE' },
  { label: 'Finance',     ticker: 'XLF' },
  { label: 'Healthcare',  ticker: 'XLV' },
  { label: 'Bitcoin',     ticker: 'BTC-USD' },
];

export default function FinanceNewsPage() {
  const [topic, setTopic]     = useState(TOPICS[0]);
  const [news, setNews]       = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    setLoading(true);
    fetch(`/api/finance/news/${topic.ticker}?count=30`)
      .then(r => r.json())
      .then(d => { if (d.ok) setNews(d.news ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topic]);

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper size={12} style={{ color: FINANCE_COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: FINANCE_COLOR }}>
              Financial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Market News
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Latest headlines driving the markets
          </p>
        </div>
        <div className="w-full sm:w-80">
          <FinanceSearchBar />
        </div>
      </div>

      {/* Topic filter */}
      <div className="flex gap-2 flex-wrap">
        {TOPICS.map(t => (
          <button
            key={t.ticker}
            onClick={() => setTopic(t)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
            style={{
              background: topic.ticker === t.ticker ? FINANCE_COLOR : 'var(--bg-card)',
              color:      topic.ticker === t.ticker ? '#fff' : 'var(--text-muted)',
              border:     `1px solid ${topic.ticker === t.ticker ? FINANCE_COLOR : 'var(--border-default)'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* News grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>No news found for this topic.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {news.map((article, i) => <NewsCard key={i} article={article} />)}
        </div>
      )}
    </div>
  );
}
