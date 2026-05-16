import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ColdReach — Cold Email Outreach Platform',
  description: 'Scalable cold email outreach with intelligent scheduling and personalization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-white antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1c1c27',
                  color: '#fff',
                  border: '1px solid #2a2a3a',
                  borderRadius: '12px',
                },
                success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
