import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { SessionProvider } from 'next-auth/react';
import { LiveDataProvider } from '@/components/sync/LiveDataProvider';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'], weight: ['500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: { default: 'EdgeAI', template: '%s | EdgeAI' },
  description: 'AI-powered sports predictions with transparent reasoning, confidence scoring, and continuous learning.',
  keywords: ['sports predictions', 'AI analytics', 'sports intelligence', 'statistical analysis'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* Skip to main content — keyboard and screen reader navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Skip to content
        </a>
        <SessionProvider>
          <LiveDataProvider>
            <AppShell>{children}</AppShell>
          </LiveDataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
