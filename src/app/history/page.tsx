import { Metadata } from 'next';
import { HistoryClient } from '@/components/history/HistoryClient';
import { EXTENDED_HISTORY } from '@/lib/dashboardData';

export const metadata: Metadata = { title: 'Prediction History' };

export default function HistoryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Prediction History</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {EXTENDED_HISTORY.length} completed predictions · Search, filter, and export results
        </p>
      </div>
      <HistoryClient rows={EXTENDED_HISTORY} />
    </div>
  );
}
