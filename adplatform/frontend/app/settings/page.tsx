'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, AnimatedButton, BouncingDots } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { FaGear, FaUser, FaShield, FaArrowRight } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };
const onF = (e: any) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; };
const onB = (e: any) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', language: 'en' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) setForm({ name: user.name || '', language: user.language || 'en' });
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data);
      toast('Profile updated!', 'success');
    } catch { toast('Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    admin:        { bg: '#F9F6EA', text: '#8F7212', border: '#E3C762' },
    
    advertiser:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  };
  const rc = roleColors[user?.role || 'advertiser'];

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <FaGear size={17} color="#D4AF37" />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Settings</h1>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Manage your account and preferences</p>
          </div>

          {/* Profile card */}
          <FadeCard style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#D4AF37,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>{user?.name}</p>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 6px' }}>{user?.email}</p>
                <span style={{ fontSize: 10, fontWeight: 800, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#FAFAFA', color: '#94A3B8', cursor: 'not-allowed' }} />
                <p style={{ fontSize: 11, color: '#CBD5E1', margin: '5px 0 0' }}>Email cannot be changed</p>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Language</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                  <option value="en">English</option>
                  <option value="yo">Yoruba</option>
                  <option value="ig">Igbo</option>
                  <option value="ha">Hausa</option>
                </select>
              </div>
              <AnimatedButton
                loading={saving}
                loadingText="Saving"
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 800, alignSelf: 'flex-start' }}
              >
                <FaArrowRight size={12} /> Save Changes
              </AnimatedButton>
            </div>
          </FadeCard>

          {/* Account info */}
          <FadeCard delay={0.1} style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <FaUser size={14} color="#D4AF37" />
              <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Account Details</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['Account type', user?.role?.replace('_', ' ') || '—'],
                ['Credit balance', `₦${(user?.credits || 0).toLocaleString()}`],
                ['Member since', 'Active'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          </FadeCard>

          {/* Danger zone */}
          <FadeCard delay={0.18} style={{ ...card, padding: '22px 24px', border: '1px solid #FEE2E2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FaShield size={14} color="#EF4444" />
              <p style={{ fontSize: 14, fontWeight: 800, color: '#EF4444', margin: 0 }}>Danger Zone</p>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.6 }}>Deleting your account is permanent and cannot be undone. All bookings and data will be lost.</p>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: '1.5px solid #EF4444', color: '#EF4444', borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
              Delete My Account
            </button>
          </FadeCard>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
