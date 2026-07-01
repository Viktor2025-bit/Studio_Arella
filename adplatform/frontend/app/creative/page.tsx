'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, AnimatedButton } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { FaPaintbrush, FaFilm, FaImage, FaCheck, FaArrowRight, FaUsers } from 'react-icons/fa6';
import Link from 'next/link';

const F = "'Quicksand', sans-serif";
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 } as React.CSSProperties;

const AD_TYPES = [
  { id: 'image', icon: FaImage, label: 'Image/Flyer', desc: 'Static image or designed flyer', color: '#D4AF37' },
  { id: 'video', icon: FaFilm, label: 'Short Video', desc: 'Animated or filmed video ad', color: '#E8CE5E' },
  { id: 'animated', icon: FaPaintbrush, label: 'Animated Graphics', desc: 'Motion graphics / slideshow', color: '#22c55e' },
];

const BUDGET_RANGES = [
  'Under ₦5,000',
  '₦5,000 – ₦15,000',
  '₦15,000 – ₦30,000',
  '₦30,000 – ₦50,000',
  '₦50,000+',
];

export default function RequestCreativePage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    business_name: '',
    contact_phone: '',
    ad_type: 'image',
    description: '',
    target_audience: '',
    preferred_dates: '',
    budget_range: '',
    reference_links: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!form.business_name || !form.contact_phone || !form.description) {
      toast('Please fill in business name, phone, and ad description', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/creative-requests', form);
      setSubmitted(true);
      toast('Creative request submitted! The Bems team will contact you within 24 hours.', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <PageTransition>
          <div style={{ fontFamily: F, maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <FaCheck size={28} color="#22c55e" />
              </div>
            </motion.div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', margin: '0 0 10px', letterSpacing: '-0.3px' }}>Request Received!</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 8px', lineHeight: 1.6 }}>
              The <strong style={{ color: '#1A1A1A' }}>Bems creative team</strong> will reach out to you on <strong style={{ color: '#1A1A1A' }}>{form.contact_phone}</strong> within <strong style={{ color: '#22c55e' }}>24 hours</strong> to discuss your ad.
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 28px', lineHeight: 1.6 }}>
              They will work with you to ensure your best work is showcased on the Studio Arella screen at Bems Junction.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/book" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D4AF37', color: '#111111', padding: '11px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Book a Slot <FaArrowRight size={12} />
              </Link>
              <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '11px 22px', borderRadius: 10, fontSize: 13, textDecoration: 'none' }}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, maxWidth: 680, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <FaPaintbrush size={18} color="#E8CE5E" />
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.3px' }}>Request Ad Creative</h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
              Don&apos;t have an ad ready? Our team will create one for you. Fill in the brief below and we&apos;ll be in touch within 24 hours.
            </p>
          </div>

          {/* Info banner */}
          <div style={{ ...card, padding: '14px 18px', marginBottom: 24, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', display: 'flex', gap: 12 }}>
            <FaUsers size={16} color="#E8CE5E" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: '0 0 3px' }}>Bems Creative Team</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                We have a team that will come to you, or work with you remotely, to create your ad or flyer — ensuring your best work is showcased on the screen.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Business info */}
            <div style={{ ...card, padding: 24 }}>
              <p style={{ fontWeight: 700, color: '#1A1A1A', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>Your Business</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Business Name *</label>
                  <input
                    value={form.business_name}
                    onChange={e => setForm({ ...form, business_name: e.target.value })}
                    placeholder="e.g. Chukwu Supermarket"
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Phone *</label>
                  <input
                    value={form.contact_phone}
                    onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    type="tel"
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Ad type */}
            <div style={{ ...card, padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type of Ad</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {AD_TYPES.map(({ id, icon: Icon, label, desc, color }) => (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm({ ...form, ad_type: id })}
                    style={{
                      padding: '14px 12px', background: form.ad_type === id ? `${color}12` : '#FAFAFA',
                      border: `1.5px solid ${form.ad_type === id ? color : '#F8FAFC'}`,
                      borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontFamily: F,
                    }}
                  >
                    <Icon size={20} color={form.ad_type === id ? color : '#94A3B8'} style={{ margin: '0 auto 6px', display: 'block' }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: form.ad_type === id ? color : '#64748B', margin: '0 0 2px' }}>{label}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Ad brief */}
            <div style={{ ...card, padding: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ad Brief</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What should the ad say/show? *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Promote our grand opening sale — 50% off all items, valid this weekend only. Should include our logo, address and phone number."
                    rows={4}
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target audience (optional)</label>
                  <input
                    value={form.target_audience}
                    onChange={e => setForm({ ...form, target_audience: e.target.value })}
                    placeholder="e.g. Young adults, local shoppers, students, drivers passing Bems Junction"
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preferred ad dates (optional)</label>
                    <input
                      value={form.preferred_dates}
                      onChange={e => setForm({ ...form, preferred_dates: e.target.value })}
                      placeholder="e.g. This Saturday, or any weekday next week"
                      style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Design budget range</label>
                    <select
                      value={form.budget_range}
                      onChange={e => setForm({ ...form, budget_range: e.target.value })}
                      style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: form.budget_range ? '#1A1A1A' : '#94A3B8', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                    >
                      <option value="">Select range</option>
                      {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reference links or inspiration (optional)</label>
                  <input
                    value={form.reference_links}
                    onChange={e => setForm({ ...form, reference_links: e.target.value })}
                    placeholder="Links to ads you like, your website, social media page, etc."
                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1A1A1A', borderRadius: 10, padding: '11px 14px', fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <AnimatedButton
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', padding: '14px', background: '#E8CE5E', color: '#F8FAFC', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {submitting ? 'Submitting...' : <><FaPaintbrush size={15} /> Submit Creative Brief</>}
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
