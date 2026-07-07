import type { Metadata } from 'next';
import { Quicksand, Outfit } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-quicksand',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studio Arella — Bems Screens | Advertise in Umuahia',
  description: 'Book ad slots on the Studio Arella LED screen at Bems Junction, Umuahia. Plans from ₦1,000 per minute. Upload your ad, select your slot, pay online — go live from anywhere in the world.',
  keywords: ['outdoor advertising', 'billboard Umuahia', 'ad screen Nigeria', 'Bems Group', 'Studio Arella', 'Abia State advertising'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${outfit.variable}`}>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
