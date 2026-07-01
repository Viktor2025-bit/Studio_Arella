'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { FaArrowRight, FaCreditCard, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";

export default function FinancesPaymentCallbackPage() {
  return (
    <Suspense fallback={<div />}>
      <FinancesPaymentCallbackContent />
    </Suspense>
  );
}

function FinancesPaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = params.get('paymentReference') || params.get('reference');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    api.get(`/payments/verify/${reference}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Credits added successfully.');
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
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Please wait, updating your balance...</p>
          </>
        )}

        {status === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaCircleCheck size={30} color="#22c55e" />
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Credits Added</p>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px', letterSpacing: '-0.3px' }}>Top-up Successful!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/finances" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Go to Finances <FaArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FaCircleXmark size={30} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px' }}>Top-up Failed</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/finances" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Try Again <FaArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
