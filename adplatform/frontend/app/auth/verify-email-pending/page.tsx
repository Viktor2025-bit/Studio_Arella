'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { theme } from '@/lib/theme';
import { useToast } from '@/components/ui/ToastProvider';

const F = "'Outfit', sans-serif";

function VerifyEmailPendingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = params.get('email') || 'your email';
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setSent(true);
      toast('Verification email resent! Please check your inbox.', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to resend. Please try again.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #0a0a0a 100%)',
      fontFamily: F,
      padding: '24px',
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '48px 40px',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        position: 'relative',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
          border: '2px solid rgba(212,175,55,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 0 40px rgba(212,175,55,0.15)',
        }}>
          <Mail size={36} color={theme.color.gold} />
        </div>

        {/* Heading */}
        <h1 style={{ color: '#F8FAFC', fontSize: 26, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
          Check your inbox
        </h1>
        <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
          We've sent a verification link to
        </p>
        <div style={{
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 28,
          color: theme.color.gold,
          fontWeight: 700,
          fontSize: 15,
          wordBreak: 'break-all',
        }}>
          {email}
        </div>

        <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7, marginBottom: 32 }}>
          Click the link in that email to activate your account.<br />
          The link expires in <strong style={{ color: '#94A3B8' }}>24 hours</strong>.
        </p>

        {/* Steps */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 32, textAlign: 'left' }}>
          {[
            { num: '1', text: 'Open your email app' },
            { num: '2', text: 'Find the email from Studio Arella' },
            { num: '3', text: 'Click "Verify my email" in the email' },
            { num: '4', text: 'You\'ll be logged in automatically' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: step.num === '4' ? 0 : 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: theme.color.gold }}>
                {step.num}
              </div>
              <span style={{ color: '#CBD5E1', fontSize: 13 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Resend button */}
        {sent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#4ADE80', fontWeight: 700, fontSize: 14, marginBottom: 20 }}>
            <CheckCircle2 size={18} /> Email resent successfully!
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#E2E8F0',
              fontFamily: F,
              fontSize: 14,
              fontWeight: 700,
              cursor: resending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
              transition: 'all 0.2s',
              opacity: resending ? 0.6 : 1,
            }}
          >
            <RefreshCw size={16} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
            {resending ? 'Resending...' : "Didn't get it? Resend email"}
          </button>
        )}

        {/* Already verified */}
        <button
          onClick={() => router.push('/auth/login')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.color.gold,
            fontFamily: F,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px',
          }}
        >
          Already verified? Sign in <ArrowRight size={14} />
        </button>

        {/* Check spam note */}
        <p style={{ color: '#475569', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          Can't find it? Check your <strong style={{ color: '#64748B' }}>Spam</strong> or <strong style={{ color: '#64748B' }}>Junk</strong> folder.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading...</div>}>
      <VerifyEmailPendingContent />
    </Suspense>
  );
}
