import { Metadata } from 'next';
import './globals.css';

// Service worker registration script (client-side only)
const serviceWorkerScript = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    });
  }
`;

// SEO Metadata - JSON-LD structured data for Organization
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Vekil',
  description: 'Otonom apartman ve site yönetimi için AI destekli SaaS platformu',
  url: 'https://vekil.tasci.cloud',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TRY',
    description: 'Ücretsiz başlangıç planı mevcut',
  },
  provider: {
    '@type': 'Organization',
    name: 'Vekil',
    url: 'https://vekil.tasci.cloud',
  },
};

// Open Graph metadata
export const metadata: Metadata = {
  title: 'Vekil - Otonom Apartman ve Site Yönetimi',
  description: 'AI destekli apartman ve site yönetimi SaaS platformu. WhatsApp ile borç sorgulama, otomatik aidat, teknik servis ve rezervasyon yönetimi.',
  keywords: ['apartman yönetimi', 'site yönetimi', 'aidat yönetimi', 'condominium yönetim', 'Turkish property management', 'apartman yönetim programı'],
  authors: [{ name: 'Vekil' }],
  creator: {
    name: 'Vekil',
    url: 'https://vekil.tasci.cloud',
  },
  publisher: {
    name: 'Vekil',
    url: 'https://vekil.tasci.cloud',
  },
  manifest: '/manifest.json', // PWA manifest
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://vekil.tasci.cloud',
    siteName: 'Vekil',
    title: 'Vekil - Otonom Apartman ve Site Yönetimi',
    description: 'AI destekli apartman ve site yönetimi SaaS platformu',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vekil - Apartman Yönetimi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vekil - Otonom Apartman ve Site Yönetimi',
    description: 'AI destekli apartman ve site yönetimi SaaS platformu',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vekil',
  },
};

// Additional structured data for Organization
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Vekil',
  description: 'AI destekli apartman ve site yönetimi SaaS platformu',
  url: 'https://vekil.tasci.cloud',
  telephone: '+90-XXX-XXX-XXXX',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TR',
    addressRegion: 'Türkiye',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 39.9334,
    longitude: 32.8597,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  sameAs: [
    'https://github.com/suleymantasci/vekil',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, organizationJsonLd]) }}
        />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="color-scheme" content="light" />
        
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vekil" />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />
      </head>
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  );
}