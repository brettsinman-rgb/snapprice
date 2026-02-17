import '@/styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Parts Vertical',
  description: 'Snap a product photo and find the best prices.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
