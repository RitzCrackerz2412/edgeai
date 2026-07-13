import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Financial Intelligence', template: '%s | Finance | EdgeAI' },
  description: 'AI-powered financial research, real-time market data, and quantitative analysis.',
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
