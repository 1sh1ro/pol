import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Proof of Love - 波卡生态开发者影响力平台',
  description: '基于 Polkadot 生态的去中心化社交影响力平台，通过量化开发者的爱心贡献和社区参与，搭建全球 Polkadot 生态与中文开发者之间的桥梁。',
  keywords: 'Polkadot, Substrate, 区块链, 开发者社区, 贡献证明, 去中心化, NFT, 治理',
  authors: [{ name: 'Proof of Love Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#d946ef',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Proof of Love - 波卡生态开发者影响力平台',
    description: '通过爱心贡献构建的去中心化影响力网络',
    url: 'https://proofoflove.io',
    siteName: 'Proof of Love',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Proof of Love Platform',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proof of Love - 波卡生态开发者影响力平台',
    description: '通过爱心贡献构建的去中心化影响力网络',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}