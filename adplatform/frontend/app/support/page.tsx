'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageTransition, FadeCard, AnimatedButton } from '@/components/ui/Animations';
import { useToast } from '@/components/ui/ToastProvider';
import { FaHeadset, FaPhone, FaEnvelope, FaLocationDot, FaChevronDown, FaArrowRight } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: F, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };
const onF = (e: any) => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; };
const onB = (e: any) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; };

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
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.4, fontFamily: F }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          style={{ width: 26, height: 26, borderRadius: 7, background: open ? '#D4AF37' : '#F8FAFC', border: `1px solid ${open ? '#D4AF37' : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FaChevronDown size={11} color={open ? '#fff' : '#94A3B8'} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75, margin: '0 0 16px', paddingRight: 40, fontFamily: F }}>{a}</p>
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
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <FaHeadset size={17} color="#D4AF37" />
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Support</h1>
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Get help with your Studio Arella bookings and account</p>
          </div>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { Icon: FaPhone,       color: '#D4AF37', bg: '#F9F6EA', border: '#E3C762', label: 'Call / WhatsApp',    value: '08164523926',                    sub: 'Diekolayomi Samuel Babatunde' },
              { Icon: FaEnvelope,    color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Email Support',      value: 'Use the ticket form',            sub: 'Response within 24 hours' },
              { Icon: FaLocationDot, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', label: 'Our Location',       value: 'Bems Junction, Umuahia',         sub: 'Finbars, Bende Road, Abia State' },
            ].map(({ Icon, color, bg, border, label, value, sub }) => (
              <FadeCard key={label} style={{ ...card, padding: '18px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={16} color={color} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px' }}>{value}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{sub}</p>
              </FadeCard>
            ))}
          </div>

          {/* FAQ */}
          <FadeCard delay={0.15} style={{ ...card, padding: '22px 24px' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.2px' }}>Frequently Asked Questions</p>
            {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </FadeCard>

          {/* Ticket form */}
          <FadeCard delay={0.22} style={{ ...card, padding: '22px 24px' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', margin: '0 0 16px', letterSpacing: '-0.2px' }}>Submit a Support Ticket</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issue type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }} onFocus={onF} onBlur={onB}>
                  <option value="">Select issue type</option>
                  <option>Booking issue</option>
                  <option>Payment / Credits</option>
                  <option>Account access</option>
                  <option>Creative request</option>
                  <option>Technical problem</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
                <input type="text" placeholder="Brief description of your issue" value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} style={inputStyle} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
                <textarea placeholder="Describe your issue in detail..." value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 } as any} onFocus={onF} onBlur={onB} />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#D4AF37', color: '#111111', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: F, alignSelf: 'flex-start' }}>
                Submit Ticket <FaArrowRight size={12} />
              </motion.button>
            </div>
          </FadeCard>

        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
