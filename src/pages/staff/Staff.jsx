import { useCallback, useEffect, useState } from 'react';
import {
  UserCog, Plus, Pencil, RotateCcw, SearchX, User, Mail, Phone,
  KeyRound, ShieldCheck, UserPlus, Clock,
} from 'lucide-react';
import { staffApi, rolesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, EmptyState, useToast, Modal, Input, StatusBadge, Badge, Avatar,
  TableSkeleton, Label,
} from '../../components/ui';
import { fmtDate, timeAgo, labelize, cx } from '../../lib/utils';

const EMPTY = { name: '', email: '', phone: '', password: '', role_id: '', status: 'active' };

const STATUS_PILL = {
  active: 'bg-emerald-50 ring-emerald-300 text-emerald-700',
  inactive: 'bg-slate-100 ring-slate-300 text-slate-600',
  suspended: 'bg-rose-50 ring-rose-300 text-rose-700',
};

export default function Staff() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffApi.list({ page, limit: 15, search });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  useEffect(() => {
    rolesApi.list().then((r) => setRoles(r.data.data.roles)).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (modal === 'new' && (!form.password || form.password.length < 6)) return toast.error('Password min 6 chars required');
    setSaving(true);
    try {
      if (modal === 'new') { await staffApi.create(form); toast.success('Staff created'); }
      else { await staffApi.update(modal.id, form); toast.success('Staff updated'); }
      setModal(null); setForm(EMPTY); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role_id: u.role_id || '', status: u.status });
    setModal(u);
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
            <UserCog className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">People</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Staff & Roles</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{total}</span> platform staff accounts
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openNew}>Add Staff</Button>
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <CardBody>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search staff by name, email or role…"
          />
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          <TableSkeleton rows={8} cols={5} />
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No staff accounts"
            message="Create staff accounts to give your team access to this panel."
            action={
              (search) ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setPage(1); }}>Clear search</Button>
              ) : (
                <Button icon={Plus} onClick={openNew}>Add Staff</Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Staff</TH>
                <TH>Role</TH>
                <TH className="hidden md:table-cell">Last login</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <TRow key={u.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        {u.status === 'active' && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {u.email}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone="violet" className="font-semibold">
                      <ShieldCheck className="w-3 h-3" /> {u.role_name}
                    </Badge>
                  </TD>
                  <TD className="hidden md:table-cell">
                    {u.last_login_at ? (
                      <>
                        <p className="text-sm text-slate-600">{fmtDate(u.last_login_at, 'DD MMM YY, hh:mm A')}</p>
                        <p className="text-xs text-slate-400">{timeAgo(u.last_login_at)}</p>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                        <Clock className="w-3.5 h-3.5" /> Never
                      </span>
                    )}
                  </TD>
                  <TD><StatusBadge status={u.status} /></TD>
                  <TD align="right">
                    <Button size="icon" variant="ghost" title="Edit staff" onClick={() => openEdit(u)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      )}

      {/* ============ Create / Edit modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Add staff member' : 'Edit staff member'}
        subtitle={modal === 'new' ? 'Create a new platform account with role access' : form.email}
        icon={modal === 'new' ? UserPlus : Pencil}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={modal === 'new' ? Plus : undefined}>
              {modal === 'new' ? 'Create staff' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Identity */}
          <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4 sm:p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-4">
              <span className="h-6 w-6 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
                <User className="w-3.5 h-3.5 text-brand-600" />
              </span>
              Identity
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full name"
                required
                placeholder="e.g. Rajesh Kumar"
                icon={User}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <Input
                label="Email"
                required
                type="email"
                placeholder="name@vcom.com"
                icon={Mail}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                disabled={modal !== 'new'}
                hint={modal !== 'new' ? 'Email cannot be changed' : undefined}
              />
              <Input
                label="Phone"
                placeholder="+91…"
                icon={Phone}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Access */}
          <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4 sm:p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-4">
              <span className="h-6 w-6 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              </span>
              Access
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={modal === 'new' ? 'Password' : 'Reset password (optional)'}
                type="password"
                required={modal === 'new'}
                placeholder="••••••••"
                icon={KeyRound}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                hint={modal === 'new' ? 'Min 6 characters' : 'Leave blank to keep current'}
              />
              <div>
                <Label required>Role</Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.role_id}
                    onChange={(e) => set('role_id', e.target.value)}
                    className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                      backgroundPosition: 'right 0.6rem center',
                      backgroundSize: '1.1em',
                    }}
                  >
                    <option value="">Select role…</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-400">Controls what this staff can access</p>
              </div>
            </div>

            <div className="mt-5">
              <Label>Status</Label>
              <div className="flex gap-2">
                {['active', 'inactive', 'suspended'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={cx(
                      'flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition-all duration-150',
                      form.status === s
                        ? STATUS_PILL[s]
                        : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300 hover:text-slate-700'
                    )}
                  >
                    {labelize(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
