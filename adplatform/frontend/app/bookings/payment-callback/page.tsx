'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { FaArrowRight, FaCalendarDays, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";
import { useCartStore } from '@/store/cartStore';

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [booking, setBooking] = useState<any>(null);
  const [message, setMessage] = useState('');
  const { clearCart } = useCartStore();

  useEffect(() => {
    const reference = params.get('paymentReference') || params.get('reference') || params.get('trxref');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    // Auto-detect gateway from reference prefix
    const verifyUrl = reference.startsWith('PS-')
      ? `/payments/paystack/verify/${reference}`
      : `/payments/verify/${reference}`;

    api.get(verifyUrl)
      .then(res => {
        setStatus('success');
        setBooking(res.data.booking);
        setMessage(res.data.message);
        clearCart();
      })
      .catch(err => {
        setStatus('failed');
        setMessage(err?.response?.data?.message || 'Payment could not be verified. Please contact support.');
      });
  }, [params]);

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#F4F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 480, width: '100%', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
          <img src="/logo.png" alt="Studio Arella Logo" style={{ height: 48, objectFit: 'contain' }} />
        </Link>

        {status === 'loading' && (
          <>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 20px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 6px' }}>Confirming your payment...</p>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Please wait, this only takes a second</p>
          </>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaCircleCheck size={30} color="#22c55e" />
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Payment Confirmed</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px', letterSpacing: '-0.3px' }}>Your ad slot is booked!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>

            {booking && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: 600 }}>Booking Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Reference', booking.booking_number],
                    ['Screen', 'Studio Arella — Bems Junction'],
                    ['Amount', `₦${Number(booking.total_cost || 0).toLocaleString()}`],
                    ['Status', 'Active'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{l}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: l === 'Status' ? '#22c55e' : '#1A1A1A' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/calendar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(45,110,255,0.12)', color: '#D4AF37', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                <FaCalendarDays size={13} /> View Calendar
              </Link>
              <Link href="/bookings" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                My Bookings <FaArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaCircleXmark size={30} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px' }}>Payment Failed</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/book" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Try Again <FaArrowRight size={12} />
              </Link>
              <Link href="/support" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '12px', borderRadius: 10, fontSize: 13, textDecoration: 'none' }}>
                Get Support
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
