'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import { FaUsers, FaMagnifyingGlass } from 'react-icons/fa6';

const F = "'Quicksand', sans-serif";
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' };

const roleMeta: Record<string, { bg: string; text: string }> = {
  admin:        { bg: '#F9F6EA',  text: '#8F7212' },

  advertiser:   { bg: '#EFF6FF',  text: '#1D4ED8' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/admin/users?limit=100').then(r => setUsers(r.data.users || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const updateRole = async (id: string, role: string) => {
    setUpdating(id);
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
      toast(`Role updated to ${role.replace('_', ' ')}`, 'success');
    } catch { toast('Failed to update role', 'error'); }
    finally { setUpdating(null); }
  };

  const filtered = users.filter(u => {
    const s = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return s && (roleFilter === 'all' || u.role === roleFilter);
  });

  const inputStyle: React.CSSProperties = { background: '#fff', border: '1.5px solid #E5E7EB', color: '#1A1A1A', borderRadius: 9, padding: '9px 10px 9px 34px', fontSize: 13, outline: 'none', fontFamily: F, width: '100%', boxSizing: 'border-box' };

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <FaUsers size={17} color="#D4AF37" />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>User Management</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{users.length} registered users</p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FaMagnifyingGlass size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#D4AF37'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }} />
          </div>
          {['all', 'advertiser', 'admin'].map(r => (
            <motion.button key={r} whileTap={{ scale: 0.96 }} onClick={() => setRoleFilter(r)}
              style={{ padding: '8px 14px', background: roleFilter === r ? '#D4AF37' : '#fff', border: `1.5px solid ${roleFilter === r ? '#D4AF37' : '#E5E7EB'}`, color: roleFilter === r  ? '#111111' : '#64748B', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F, textTransform: 'capitalize' }}>
              {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
            </motion.button>
          ))}
        </div>

        <div style={card}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                {['User', 'Email', 'Role', 'Credits', 'Joined', 'Change Role'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: '#94A3B8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={13} width={j === 0 ? 110 : 70} /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No users found</td></tr>
              ) : filtered.map(u => {
                const rm = roleMeta[u.role] || roleMeta.advertiser;
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ borderTop: '1px solid #F8FAFC' }}
                    whileHover={{ background: '#FAFAFA' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#D4AF37,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#64748B' }}>{u.email}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rm.text, background: rm.bg, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#16A34A', fontWeight: 700 }}>₦{Number(u.credits || 0).toLocaleString()}</td>
                    <td style={{ padding: '13px 16px', color: '#94A3B8', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} disabled={updating === u.id}
                        style={{ background: '#F8FAFC', border: '1.5px solid #E5E7EB', color: '#475569', borderRadius: 7, padding: '5px 8px', fontSize: 12, cursor: 'pointer', fontFamily: F, outline: 'none' }}>
                        <option value="advertiser">Advertiser</option>
                        
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
