import '@/styles/globals.css';
import type { ReactNode } from 'react';
import Script from 'next/script';

export const metadata = {
  title: 'Parts Vertical',
  description: 'Snap a product photo and find the best prices.',
  icons: {
    icon: '/logos/camera-icon.png',
    shortcut: '/logos/camera-icon.png',
    apple: '/logos/camera-icon.png'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Script
          id="gpt-loader"
          async
          strategy="afterInteractive"
          src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        />
        <Script id="gpt-init" strategy="afterInteractive">
          {`window.googletag = window.googletag || { cmd: [] };`}
        </Script>
        {children}
      </body>
    </html>
  );
}
