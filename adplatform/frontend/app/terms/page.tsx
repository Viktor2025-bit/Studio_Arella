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

export default function TermsPage() {
  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Nav */}
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
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Terms of Service</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Last updated: {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <Section title="1. About Studio Arella">
            <p>Studio Arella is a digital advertising platform operated by Bems Group, located at Bems Junction, Finbars by Bende Road, Umuahia, Abia State, Nigeria. By accessing or using our platform at bemsscreens.com and our digital advertising services, you agree to be bound by these Terms of Service.</p>
          </Section>

          <Section title="2. Advertising Services">
            <p style={{ marginBottom: 10 }}>Studio Arella provides digital advertising space on our LED screen located at Bems Junction, Umuahia. Our services include:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Sale of advertising time slots starting from ₦1,000 per minute</li>
              <li style={{ marginBottom: 6 }}>Professional graphic design and flyer creation services</li>
              <li style={{ marginBottom: 6 }}>Promotional video production at your business location</li>
              <li style={{ marginBottom: 6 }}>Online booking and scheduling of advertising slots</li>
            </ul>
          </Section>

          <Section title="3. Booking and Payment">
            <p style={{ marginBottom: 10 }}>All bookings are subject to availability. Payments are processed securely through Monnify. By completing a booking, you agree that:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Payment is required in full at the time of booking</li>
              <li style={{ marginBottom: 6 }}>Bookings are confirmed only upon successful payment</li>
              <li style={{ marginBottom: 6 }}>Cancellations made more than 24 hours before the scheduled slot are eligible for a full credit refund</li>
              <li style={{ marginBottom: 6 }}>Cancellations within 24 hours of the booked slot are non-refundable</li>
            </ul>
          </Section>

          <Section title="4. Advertising Content Policy">
            <p style={{ marginBottom: 10 }}>You are solely responsible for the content of your advertisements. Prohibited content includes:</p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 6 }}>Illegal products or services under Nigerian law</li>
              <li style={{ marginBottom: 6 }}>Misleading or fraudulent claims</li>
              <li style={{ marginBottom: 6 }}>Adult, violent, or offensive content</li>
              <li style={{ marginBottom: 6 }}>Content that infringes on third-party intellectual property rights</li>
              <li style={{ marginBottom: 6 }}>Political campaign advertising without prior written approval</li>
            </ul>
            <p style={{ marginTop: 10 }}>Studio Arella reserves the right to reject or remove any advertisement that violates these policies without refund.</p>
          </Section>

          <Section title="5. Creative Services">
            <p>Our professional creative team offers graphic design and video production services at separately agreed rates. Creative work produced by our team remains the property of the client upon full payment. Studio Arella retains the right to display completed work as portfolio samples unless otherwise agreed in writing.</p>
          </Section>

          <Section title="6. Screen Availability">
            <p>While we endeavour to maintain 24/7 screen availability, Studio Arella is not liable for interruptions caused by power outages, technical faults, weather events, or circumstances beyond our reasonable control. In such cases, affected bookings will be rescheduled or credited at our discretion.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>Studio Arella's liability to you for any claim arising from these terms shall not exceed the amount paid by you for the specific booking in question. We are not liable for indirect, consequential, or loss of business damages.</p>
          </Section>

          <Section title="8. Contact">
            <p>For any questions regarding these Terms, contact:<br />
              <strong>Studio Arella Manager — Diekolayomi Samuel Babatunde</strong><br />
              Phone: <a href="tel:08164523926" style={{ color: '#D4AF37' }}>08164523926</a><br />
              Location: Bems Junction, Finbars by Bende Road, Umuahia, Abia State
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
