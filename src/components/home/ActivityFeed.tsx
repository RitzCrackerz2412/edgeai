import type { ActivityItem } from '@/lib/dashboardData';
import { CheckCircle, XCircle, AlertTriangle, Zap, TrendingUp, BarChart2 } from 'lucide-react';

const ICON_MAP = {
  correct:   { Icon: CheckCircle,  color: 'var(--success)',       bg: 'var(--success-dim)' },
  wrong:     { Icon: XCircle,      color: 'var(--danger)',        bg: 'var(--danger-dim)'  },
  upset:     { Icon: AlertTriangle,color: 'var(--warning)',       bg: 'var(--warning-dim)' },
  high_conf: { Icon: Zap,          color: 'var(--accent-light)',  bg: 'var(--accent-dim)'  },
  streak:    { Icon: TrendingUp,   color: 'var(--success)',       bg: 'var(--success-dim)' },
  model:     { Icon: BarChart2,    color: 'var(--info)',          bg: 'var(--info-dim)'    },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-1">
      {items.map(item => {
        const { Icon, color, bg } = ICON_MAP[item.type];
        return (
          <div key={item.id} className="flex items-start gap-3 py-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: bg }}
            >
              <Icon size={13} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                {item.title}
                {item.confidence !== undefined && (
                  <span className="ml-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    ({item.confidence}%)
                  </span>
                )}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {item.detail}
              </div>
            </div>
            <div className="text-[11px] shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {item.timestamp}
            </div>
          </div>
        );
      })}
    </div>
  );
}
