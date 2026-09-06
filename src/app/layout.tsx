import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://cardgraph.vercel.app'),
  title: {
    default: 'CardGraph — premium trading-card graphics in seconds',
    template: '%s · CardGraph',
  },
  description:
    'Turn a card photo into a finished price, population or sales graphic. Editable templates, light and dark exports, PNG, JPG, GIF and MP4 — all in your browser.',
  keywords: ['trading cards', 'TCG', 'card graphics', 'PSA', 'price chart', 'card design'],
  openGraph: {
    title: 'CardGraph — premium trading-card graphics in seconds',
    description:
      'Editable templates for card price, population and sales graphics. Export PNG, JPG, GIF and MP4 straight from your browser.',
    type: 'website',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#08090A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
