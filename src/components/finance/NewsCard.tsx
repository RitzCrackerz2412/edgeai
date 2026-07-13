'use client';

import type { NewsArticle } from '@/lib/finance/types';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-xl transition-all hover:opacity-80 cursor-pointer"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
    >
      {article.thumbnail && (
        <img
          src={article.thumbnail}
          alt=""
          className="rounded-lg object-cover shrink-0"
          style={{ width: 64, height: 48 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{article.publisher}</span>
          <span className="text-[10px]" style={{ color: 'var(--border-strong)' }}>·</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(article.publishedAt)}</span>
          {article.tickers.slice(0, 3).map(t => (
            <span key={t} className="text-[9px] font-semibold px-1 py-0.5 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
