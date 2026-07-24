'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FaHeadset, FaPhone, FaEnvelope, FaLocationDot, FaChevronDown, FaArrowRight, FaCommentDots } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '@/lib/theme';

const F = theme.font.body;

const FAQS = [
  { q: 'How do I book an ad slot on Studio Arella?', a: 'Go to "Book Ad Slot" in the sidebar. Select your date on the calendar, choose a plan (from ₦1,000 for 1 minute), set your time slot, and pay securely via Monnify.' },
  { q: 'What if I don\'t have an ad ready?', a: 'Our creative team at Bems Group can design your ad for you. Use "Request Creative" in the sidebar or call 08164523926 to speak with the Studio Arella manager directly.' },
  { q: 'Where is the Studio Arella screen located?', a: 'Bems Junction, Finbars, Bende Road, Umuahia, Abia State. It is a 10ft × 6ft digital LED display at one of Umuahia\'s highest-traffic locations.' },
  { q: 'How does billing work?', a: 'You pay once at booking via Monnify. Credits are instantly confirmed and your ad slot is secured. No monthly fees, no contracts, no hidden charges.' },
  { q: 'Can I cancel or pause my booking?', a: 'Yes. Go to My Bookings, find your booking, and update the status. Unused credit from cancelled bookings is refunded to your wallet within 24 hours.' },
  { q: 'How do I contact Studio Arella directly?', a: 'Call or WhatsApp Diekolayomi Samuel Babatunde (Studio Arella Manager) on 08164523926. You can also use the ticket form below.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: theme.color.surface, borderRadius: 16, border: open ? `2px solid ${theme.color.gold}` : `1px solid ${theme.color.border2}`, marginBottom: 16, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: open ? `0 8px 24px rgba(239, 184, 66, 0.15)` : '0 4px 12px rgba(0,0,0,0.02)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: open ? theme.color.goldLight : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 14, transition: 'all 0.2s' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: theme.color.text1, lineHeight: 1.4, fontFamily: F, letterSpacing: '-0.2px' }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ width: 32, height: 32, borderRadius: '50%', background: open ? theme.color.gold : theme.color.surface2, border: open ? 'none' : `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: open ? '0 4px 8px rgba(0,0,0,0.1)' : 'none' }}>
          <FaChevronDown size={14} color={open ? theme.color.charcoal900 : theme.color.text3} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 14, color: theme.color.text2, lineHeight: 1.7, margin: '0', padding: '0 24px 24px', fontFamily: F }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  const [form, setForm] = useState({ type: '', subject: '', message: '' });
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!form.subject || !form.message) { toast('Please fill in all fields', 'error'); return; }
    toast('Ticket submitted! We\'ll get back to you within 24 hours.', 'success');
    setForm({ type: '', subject: '', message: '' });
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div style={{ fontFamily: F, maxWidth: 1000, margin: '0 auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* Hero Section */}
          <div style={{ textAlign: 'center', padding: '40px 20px', background: `linear-gradient(135deg, ${theme.color.surface}, ${theme.color.surface2})`, borderRadius: 24, border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.sm }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(239, 184, 66, 0.3)' }}>
              <FaHeadset size={28} color={theme.color.charcoal900} />
            </div>
            <h1 style={{ fontFamily: theme.font.display, fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: theme.color.text1, margin: '0 0 12px', letterSpacing: '-0.5px' }}>How can we help you?</h1>
            <p style={{ fontSize: 16, color: theme.color.text3, margin: '0 auto', maxWidth: 500, lineHeight: 1.5 }}>
              Get help with your Studio Arella bookings, request creative assistance, or manage your account.
            </p>
          </div>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { Icon: FaPhone,       color: theme.color.charcoal900, bg: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, label: 'Call / WhatsApp', value: '08164523926',            sub: 'Diekolayomi Samuel Babatunde' },
              { Icon: FaEnvelope,    color: '#fff',                  bg: `linear-gradient(135deg, #00C3FF 0%, #0052CC 100%)`,     label: 'Email Support',   value: 'Use the ticket form',    sub: 'Response within 24 hours' },
              { Icon: FaLocationDot, color: '#fff',                  bg: `linear-gradient(135deg, #10B981 0%, #047857 100%)`,     label: 'Our Location',    value: 'Bems Junction, Umuahia', sub: 'Finbars, Bende Road, Abia State' },
            ].map(({ Icon, color, bg, label, value, sub }) => (
              <FadeCard key={label}>
                <div style={{ background: theme.color.surface, borderRadius: 24, padding: '32px 24px', border: `1px solid ${theme.color.border2}`, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'transform 0.2s', height: '100%' }} className="hover:-translate-y-1">
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    <Icon size={22} color={color} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: theme.color.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: theme.color.text1, margin: '0 0 4px', wordBreak: 'break-word' }}>{value}</p>
                  <p style={{ fontSize: 13, color: theme.color.text4, margin: 0 }}>{sub}</p>
                </div>
              </FadeCard>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, alignItems: 'flex-start' }}>
            
            {/* FAQ */}
            <FadeCard delay={0.15}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <FaCommentDots size={24} color={theme.color.goldDark} />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.color.text1, margin: 0, letterSpacing: '-0.3px' }}>Common Questions</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </FadeCard>

            {/* Ticket form */}
            <FadeCard delay={0.22} style={{ background: theme.color.surface, borderRadius: 24, padding: '32px', border: `1px solid ${theme.color.border2}`, boxShadow: theme.shadow.md }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <FaEnvelope size={22} color={theme.color.goldDark} />
                <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.color.text1, margin: 0, letterSpacing: '-0.3px' }}>Submit a Ticket</h2>
              </div>
              <p style={{ fontSize: 14, color: theme.color.text3, margin: '0 0 24px', lineHeight: 1.5 }}>Can't find the answer in our FAQs? Send us a message and we'll get back to you shortly.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: 12, fontSize: 14, fontFamily: F, color: theme.color.text1, outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}>
                    <option value="">Select issue type</option>
                    <option>Booking issue</option>
                    <option>Payment / Credits</option>
                    <option>Account access</option>
                    <option>Creative request</option>
                    <option>Technical problem</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <Input label="Subject" type="text" placeholder="Brief description of your issue" value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
                
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: theme.color.text2, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                  <textarea placeholder="Describe your issue in detail..." value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} rows={5}
                    style={{ width: '100%', padding: '16px', background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, borderRadius: 12, fontSize: 14, fontFamily: F, color: theme.color.text1, outline: 'none', resize: 'vertical', lineHeight: 1.6, transition: 'all 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = theme.color.gold; e.target.style.boxShadow = `0 0 0 4px rgba(224,165,38,0.15)`; }}
                    onBlur={e => { e.target.style.borderColor = theme.color.border; e.target.style.boxShadow = 'none'; }} />
                </div>
                
                <Button onClick={handleSubmit} style={{ width: '100%', background: `linear-gradient(135deg, ${theme.color.gold}, #e8a825)`, color: theme.color.charcoal900, border: 'none', padding: '16px', borderRadius: 12, fontWeight: 800, fontSize: 16, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(239, 184, 66, 0.3)' }}>
                  Submit Ticket <FaArrowRight size={14} />
                </Button>
              </div>
            </FadeCard>

          </div>

        </div>
      </PageTransition>
      <style dangerouslySetInnerHTML={{__html:`
        @media (max-width: 800px) {
          .support-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </DashboardLayout>
  );
}
