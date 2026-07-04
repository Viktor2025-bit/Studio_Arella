import type { Metadata } from 'next';
import { Quicksand, Fraunces } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-quicksand',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studio Arella — Bems Screens | Advertise in Umuahia',
  description: 'Book ad slots on the Studio Arella LED screen at Bems Junction, Umuahia. Plans from ₦1,000 per minute. Upload your ad, select your slot, pay online — go live from anywhere in the world.',
  keywords: ['outdoor advertising', 'billboard Umuahia', 'ad screen Nigeria', 'Bems Group', 'Studio Arella', 'Abia State advertising'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${fraunces.variable}`}>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
