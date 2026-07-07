'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { PageTransition, Skeleton } from '@/components/ui/Animations';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { FaUsers, FaMagnifyingGlass, FaUser } from 'react-icons/fa6';
import { theme } from '@/lib/theme';

const F = theme.font.body;
const card: React.CSSProperties = { background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' };

const roleMeta: Record<string, { bg: string; text: string }> = {
  admin:      { bg: theme.color.goldLight, text: theme.color.goldDark },
  advertiser: { bg: theme.color.infoLight, text: theme.color.info },
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

  const inputStyle: React.CSSProperties = { background: theme.color.surface, border: `1.5px solid ${theme.color.border}`, color: theme.color.text1, borderRadius: 9, padding: '9px 10px 9px 34px', fontSize: 13, outline: 'none', fontFamily: F, width: '100%', boxSizing: 'border-box' };

  return (
    <PageTransition>
      <div style={{ fontFamily: F }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <FaUsers size={17} color={theme.color.gold} />
            <h1 style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 600, color: theme.color.text1, margin: 0 }}>User Management</h1>
          </div>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0 }}>{users.length} registered users</p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <FaMagnifyingGlass size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: theme.color.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={inputStyle}
              onFocus={e => { e.target.style.borderColor = theme.color.gold; }}
              onBlur={e => { e.target.style.borderColor = theme.color.border; }} />
          </div>
          {['all', 'advertiser', 'admin'].map(r => (
            <motion.button key={r} whileTap={{ scale: 0.96 }} onClick={() => setRoleFilter(r)}
              style={{ padding: '8px 14px', background: roleFilter === r ? theme.color.gold : theme.color.surface, border: `1.5px solid ${roleFilter === r ? theme.color.gold : theme.color.border}`, color: roleFilter === r ? theme.color.charcoal900 : theme.color.text2, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: F, textTransform: 'capitalize' }}>
              {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
            </motion.button>
          ))}
        </div>

        <div style={card}>
          <Table>
            <TableHead>
              {['User', 'Email', 'Role', 'Credits', 'Joined', 'Change Role'].map(h => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableHead>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '14px 16px' }}><Skeleton height={13} width={j === 0 ? 110 : 70} /></td>)}</tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: theme.color.text3 }}>No users found</td></tr>
              ) : filtered.map(u => {
                const rm = roleMeta[u.role] || roleMeta.advertiser;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.color.surface2, border: `1px solid ${theme.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.color.text3, flexShrink: 0 }}>
                          <FaUser size={13} />
                        </div>
                        <span style={{ fontWeight: 700, color: theme.color.text1 }}>{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rm.text, background: rm.bg, padding: '3px 9px', borderRadius: 100, textTransform: 'capitalize' }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell><span style={{ color: theme.color.success, fontWeight: 700 }}>₦{Number(u.credits || 0).toLocaleString()}</span></TableCell>
                    <TableCell><span style={{ fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</span></TableCell>
                    <TableCell>
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} disabled={updating === u.id}
                        style={{ background: theme.color.surface2, border: `1.5px solid ${theme.color.border}`, color: theme.color.text2, borderRadius: 7, padding: '5px 8px', fontSize: 12, cursor: 'pointer', fontFamily: F, outline: 'none' }}>
                        <option value="advertiser">Advertiser</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageTransition>
  );
}
