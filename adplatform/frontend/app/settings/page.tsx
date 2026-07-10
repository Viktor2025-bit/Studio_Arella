'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { FaGear, FaUser, FaShield, FaArrowRight } from 'react-icons/fa6';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg };

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
    admin:      { bg: theme.color.goldLight, text: theme.color.goldDark, border: theme.color.goldMid },
    advertiser: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  };
  const rc = roleColors[user?.role || 'advertiser'];

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <FaGear size={17} color={theme.color.gold} />
              <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>Settings</h1>
            </div>
            <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Manage your account and preferences</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {/* Left Column */}
            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Profile card */}
              <FadeCard style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${theme.color.border2}` }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${theme.color.gold},${theme.color.charcoal700})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, margin: '0 0 4px' }}>{user?.name}</p>
                <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 6px' }}>{user?.email}</p>
                <span style={{ fontSize: 10, fontWeight: 800, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, padding: '2px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div>
                <Input label="Email Address" type="email" value={user?.email || ''} disabled style={{ background: theme.color.surface2, color: theme.color.text3, cursor: 'not-allowed' }} />
                <p style={{ fontSize: 11, color: theme.color.text4, margin: '5px 0 0' }}>Email cannot be changed</p>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Language</label>
                <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: theme.radius.sm, fontSize: 13, fontFamily: F, color: theme.color.text1, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
                  <option value="en">English</option>
                  <option value="yo">Yoruba</option>
                  <option value="ig">Igbo</option>
                  <option value="ha">Hausa</option>
                </select>
              </div>
              <div style={{ alignSelf: 'flex-start' }}>
                <Button loading={saving} loadingText="Saving" onClick={handleSave} variant="primary">
                  <FaArrowRight size={12} /> Save Changes
                </Button>
              </div>
            </div>
              </FadeCard>
            </div>

            {/* Right Column */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Account info */}
              <FadeCard delay={0.1} style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <FaUser size={14} color={theme.color.gold} />
              <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.text1, margin: 0 }}>Account Details</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                ['Account type', user?.role?.replace('_', ' ') || '—'],
                ['Credit balance', `₦${(user?.credits || 0).toLocaleString()}`],
                ['Member since', 'Active'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${theme.color.border2}` }}>
                  <span style={{ fontSize: 13, color: theme.color.text3 }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.color.text1, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          </FadeCard>

          {/* Danger zone */}
          <FadeCard delay={0.18} style={{ ...card, padding: '22px 24px', border: `1px solid ${theme.color.errorLight}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FaShield size={14} color={theme.color.error} />
              <p style={{ fontSize: 14, fontWeight: 800, color: theme.color.error, margin: 0 }}>Danger Zone</p>
            </div>
            <p style={{ fontSize: 13, color: theme.color.text3, margin: '0 0 16px', lineHeight: 1.6 }}>Deleting your account is permanent and cannot be undone. All bookings and data will be lost.</p>
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: `1.5px solid ${theme.color.error}`, color: theme.color.error, borderRadius: 9, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = theme.color.errorLight; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}>
              Delete My Account
            </button>
              </FadeCard>
            </div>
          </div>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
