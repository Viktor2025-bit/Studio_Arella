'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { FaUser, FaShield, FaBell, FaPalette, FaCreditCard, FaArrowRight, FaCamera, FaLock, FaKey } from 'react-icons/fa6';
import { theme } from '@/lib/theme';
import { motion } from 'framer-motion';

const F = theme.font.body;

const TABS = [
  { id: 'profile', label: 'My Profile', icon: FaUser },
  { id: 'security', label: 'Security', icon: FaShield },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'billing', label: 'Billing', icon: FaCreditCard },
  { id: 'preferences', label: 'Preferences', icon: FaPalette },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
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
      toast('Profile updated successfully!', 'success');
    } catch { toast('Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    admin:      { bg: theme.color.goldLight, text: theme.color.goldDark, border: theme.color.goldMid },
    advertiser: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' },
  };
  const rc = roleColors[user?.role || 'advertiser'];

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, maxWidth: 1100, margin: '0 auto', padding: '20px 0' }}>
          
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: theme.font.display, fontSize: 32, fontWeight: 800, color: theme.color.text1, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Settings</h1>
            <p style={{ fontSize: 15, color: theme.color.text3, margin: 0 }}>Manage your account preferences and security</p>
          </div>

          <div style={{ display: 'flex', gap: 32, flexDirection: 'row', alignItems: 'flex-start' }} className="settings-layout">
            
            {/* Sidebar Navigation */}
            <div style={{ flex: '0 0 240px', background: theme.color.surface, borderRadius: 20, padding: 12, border: `1px solid ${theme.color.border2}`, boxShadow: theme.shadow.sm, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: isActive ? theme.color.goldLight : 'transparent', color: isActive ? theme.color.charcoal900 : theme.color.text2, fontWeight: isActive ? 800 : 600, fontSize: 14, fontFamily: F, transition: 'all 0.2s', textAlign: 'left' }}
                    onMouseOver={e => { if(!isActive) { e.currentTarget.style.background = theme.color.surface2; e.currentTarget.style.color = theme.color.text1; } }}
                    onMouseOut={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.color.text2; } }}>
                    <Icon size={16} color={isActive ? theme.color.goldDark : theme.color.text3} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div style={{ background: theme.color.surface, borderRadius: 24, border: `1px solid ${theme.color.border2}`, padding: '40px', boxShadow: theme.shadow.sm, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, margin: '0 0 24px' }}>My Profile</h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, paddingBottom: 32, borderBottom: `1px solid ${theme.color.border2}` }}>
                      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: theme.color.charcoal900, boxShadow: '0 8px 24px rgba(239, 184, 66, 0.3)', cursor: 'pointer' }} className="group">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                          <FaCamera color="#fff" size={24} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, margin: 0 }}>{user?.name}</h3>
                          <span style={{ fontSize: 11, fontWeight: 800, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, padding: '4px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {user?.role?.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: theme.color.text3, margin: '0 0 12px' }}>{user?.email}</p>
                        <p style={{ fontSize: 13, color: theme.color.text4, margin: 0, fontWeight: 500 }}>Upload a new avatar. Larger image will be resized automatically.</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                      <Input label="Full Name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      <div>
                        <Input label="Email Address" type="email" value={user?.email || ''} disabled style={{ background: theme.color.surface2, color: theme.color.text3, cursor: 'not-allowed', opacity: 0.7 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Language</label>
                        <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                          style={{ width: '100%', padding: '14px 16px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: 12, fontSize: 14, fontFamily: F, color: theme.color.text1, outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}>
                          <option value="en">English</option>
                          <option value="yo">Yoruba</option>
                          <option value="ig">Igbo</option>
                          <option value="ha">Hausa</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button loading={saving} loadingText="Saving" onClick={handleSave} style={{ background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, color: theme.color.charcoal900, border: 'none', padding: '14px 28px', borderRadius: 12, fontWeight: 800, fontSize: 14, boxShadow: '0 8px 24px rgba(239, 184, 66, 0.3)' }}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <div style={{ background: theme.color.surface, borderRadius: 24, border: `1px solid ${theme.color.border2}`, padding: '40px', boxShadow: theme.shadow.sm, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <FaLock size={20} color={theme.color.goldDark} />
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: theme.color.text1, margin: 0 }}>Security Settings</h2>
                    </div>
                    <p style={{ fontSize: 14, color: theme.color.text3, margin: '0 0 32px' }}>Manage your password and secure your account with 2FA.</p>
                    
                    <div style={{ background: theme.color.surface2, borderRadius: 16, border: `1px solid ${theme.color.border2}`, padding: '24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, margin: '0 0 6px' }}>Password</h3>
                        <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Set a unique password to protect your account.</p>
                      </div>
                      <Button style={{ background: theme.color.surface, color: theme.color.text1, border: `1px solid ${theme.color.border}`, fontWeight: 700 }}>
                        Change Password
                      </Button>
                    </div>

                    <div style={{ background: theme.color.surface2, borderRadius: 16, border: `1px solid ${theme.color.border2}`, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, margin: '0 0 6px' }}>Two-Factor Authentication (2FA)</h3>
                        <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>Add an extra layer of security to your account.</p>
                      </div>
                      <div style={{ width: 48, height: 24, background: theme.color.border, borderRadius: 24, position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#FFF0F0', borderRadius: 24, border: `1px solid #FECACA`, padding: '40px', boxShadow: theme.shadow.sm }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <FaShield size={20} color="#DC2626" />
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#DC2626", margin: 0 }}>Danger Zone</h2>
                    </div>
                    <p style={{ fontSize: 14, color: "#991B1B", margin: '0 0 24px' }}>Permanently delete your account and all of your data.</p>
                    <button style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                      Delete My Account
                    </button>
                  </div>
                </motion.div>
              )}

              {(activeTab === 'notifications' || activeTab === 'billing' || activeTab === 'preferences') && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ background: theme.color.surface, borderRadius: 24, border: `1px dashed ${theme.color.border2}`, padding: '80px 40px', textAlign: 'center', boxShadow: theme.shadow.sm }}>
                  <FaKey size={48} color={theme.color.goldLight} style={{ marginBottom: 24, opacity: 0.8 }} />
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.color.text1, margin: '0 0 12px' }}>Coming Soon</h2>
                  <p style={{ fontSize: 15, color: theme.color.text3, margin: '0 auto', maxWidth: 400, lineHeight: 1.5 }}>
                    These premium features are currently being developed. They will include full granular control over your alerts, theme styling, and invoicing.
                  </p>
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </PageTransition>
      <style dangerouslySetInnerHTML={{__html:`
        @media (max-width: 768px) {
          .settings-layout { flex-direction: column !important; }
          .settings-layout > div:first-child { width: 100%; flex: none !important; }
        }
      `}} />
    </DashboardLayout>
  );
}

