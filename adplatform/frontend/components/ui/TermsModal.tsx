'use client';

import React, { useState } from 'react';
import { theme } from '@/lib/theme';
import { AnimatedButton } from '@/components/ui/Animations';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface TermsModalProps {
  onAccept: () => void;
}

export default function TermsModal({ onAccept }: TermsModalProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.post('/auth/accept-terms');
      onAccept();
    } catch (error) {
      console.error('Failed to accept terms', error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        background: theme.color.surface,
        borderRadius: 24,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadow.xl,
        overflow: 'hidden',
        border: `1px solid ${theme.color.border}`
      }}>
        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${theme.color.border}`, background: theme.color.surface2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: theme.color.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} color={theme.color.gold} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: theme.color.text1, letterSpacing: '-0.5px' }}>Terms & Conditions</h2>
              <p style={{ margin: '4px 0 0', color: theme.color.text3, fontSize: 14 }}>Please review our content policies before continuing.</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, color: theme.color.text2, fontSize: 15, lineHeight: 1.6 }}>
          <p>Welcome to <strong>Studio Arella</strong>! Before you upload and schedule your creatives, please carefully read our content guidelines. By accepting these terms, you agree to adhere to our strict advertising standards.</p>
          
          <h3 style={{ color: theme.color.text1, marginTop: 24, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>1. Prohibited Content</h3>
          <p>You may <strong>NOT</strong> upload any of the following:</p>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Content featuring nudity, explicit sexual material, or overly suggestive imagery.</li>
            <li>Content that promotes violence, hate speech, discrimination, or self-harm.</li>
            <li>Misleading, deceptive, or scam-related advertisements.</li>
            <li>Copyrighted material without explicit permission from the copyright owner.</li>
            <li>Illegal drugs, regulated substances, or politically extreme propaganda.</li>
          </ul>

          <h3 style={{ color: theme.color.text1, marginTop: 24, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>2. Review Process</h3>
          <p>While you may upload your creatives and immediately book available slots, <strong>all videos and images are subject to manual review</strong> by our administration team prior to being displayed on our screens.</p>

          <h3 style={{ color: theme.color.text1, marginTop: 24, marginBottom: 12, fontSize: 18, fontWeight: 700 }}>3. Consequences of Violation</h3>
          <div style={{ display: 'flex', gap: 12, background: 'rgba(255, 59, 48, 0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 59, 48, 0.2)', marginTop: 12 }}>
            <AlertTriangle size={24} color="#ff3b30" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: theme.color.text1 }}>
              If your creative violates our terms, your booking will be immediately cancelled. Repeated violations will result in <strong>account suspension and forfeiture of any wallet balance</strong>.
            </p>
          </div>
        </div>

        <div style={{ padding: '24px 32px', borderTop: `1px solid ${theme.color.border}`, background: theme.color.surface, display: 'flex', justifyContent: 'flex-end' }}>
          <AnimatedButton 
            onClick={handleAccept} 
            disabled={loading}
            style={{ 
              background: theme.color.gold, 
              color: theme.color.charcoal900, 
              border: 'none', 
              padding: '14px 32px', 
              borderRadius: 12, 
              fontSize: 16, 
              fontWeight: 800, 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: theme.shadow.gold
            }}
          >
            {loading ? 'Accepting...' : 'I Accept & Agree'}
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
