'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.2px' }}>{title}</h2>
    <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.75 }}>{children}</div>
  </div>
);

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F8FAFC' }}>
      <header style={{ background: '#1A1A1A', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#D4AF37', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#111111' }}>B</div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Bems Screens</span>
        </Link>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#D4AF37', textDecoration: 'none', fontWeight: 600, marginBottom: 32 }}>
          <FaArrowLeft size={12} /> Back to Home
        </Link>

        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '40px 48px' }}>
          <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid #F3F4F6' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Last updated: {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <Section title="1. Information We Collect">
            <p style={{ marginBottom: 10 }}>When you use Studio Arella, we collect:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}><strong>Account information:</strong> Your name, email address, phone number, and password when you register</li>
              <li style={{ marginBottom: 6 }}><strong>Business information:</strong> Your business name, address, and advertising preferences</li>
              <li style={{ marginBottom: 6 }}><strong>Payment information:</strong> Transaction records processed securely through Monnify (we do not store card details)</li>
              <li style={{ marginBottom: 6 }}><strong>Ad content:</strong> Images, videos, and creative materials you upload</li>
              <li style={{ marginBottom: 6 }}><strong>Usage data:</strong> How you interact with our platform, booking history, and campaign analytics</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>To process your bookings and display your advertisements</li>
              <li style={{ marginBottom: 6 }}>To send booking confirmations and important service notifications</li>
              <li style={{ marginBottom: 6 }}>To provide customer support and respond to your enquiries</li>
              <li style={{ marginBottom: 6 }}>To improve our platform and services</li>
              <li style={{ marginBottom: 6 }}>To comply with legal obligations under Nigerian law</li>
            </ul>
          </Section>

          <Section title="3. Payment Security">
            <p>All payments are processed by Monnify, a PCI-DSS compliant payment processor. We do not store, process, or transmit your card details. Your financial information is governed by Monnify's privacy policy in addition to this policy.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p style={{ marginBottom: 10 }}>We do not sell your personal data to third parties. We may share your data with:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Monnify for payment processing</li>
              <li style={{ marginBottom: 6 }}>Cloudinary for secure media storage and delivery</li>
              <li style={{ marginBottom: 6 }}>Our email service provider for transactional notifications</li>
              <li style={{ marginBottom: 6 }}>Law enforcement agencies when required by Nigerian law</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your account data for as long as your account is active. Booking records are retained for a minimum of 7 years for accounting and legal compliance. You may request deletion of your account and personal data by contacting us directly.</p>
          </Section>

          <Section title="6. Your Rights">
            <p style={{ marginBottom: 10 }}>You have the right to:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Access the personal data we hold about you</li>
              <li style={{ marginBottom: 6 }}>Correct inaccurate or incomplete data</li>
              <li style={{ marginBottom: 6 }}>Request deletion of your personal data (subject to legal requirements)</li>
              <li style={{ marginBottom: 6 }}>Withdraw consent for marketing communications at any time</li>
            </ul>
          </Section>

          <Section title="7. Cookies">
            <p>Our platform uses essential cookies for authentication and session management. We do not use third-party advertising or tracking cookies.</p>
          </Section>

          <Section title="8. Contact Us">
            <p>For any privacy concerns or data requests, contact:<br />
              <strong>Studio Arella — Bems Group</strong><br />
              Manager: Diekolayomi Samuel Babatunde<br />
              Phone: <a href="tel:08164523926" style={{ color: '#D4AF37' }}>08164523926</a><br />
              Location: Bems Junction, Finbars by Bende Road, Umuahia, Abia State, Nigeria
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
