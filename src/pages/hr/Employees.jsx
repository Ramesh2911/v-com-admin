import { useCallback, useEffect, useState } from 'react';
import {
  Users, Plus, Pencil, RotateCcw, SearchX, LayoutGrid, List, Mail, Phone,
  BadgeCheck, Building2, CalendarDays, KeyRound, IdCard, User,
} from 'lucide-react';
import { hrApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, EmptyState, useToast, Modal, Input, StatusBadge, Avatar,
  TableSkeleton, Select,
} from '../../components/ui';
import { fmtDate, cx } from '../../lib/utils';

const EMPTY = { name: '', email: '', phone: '', password: '', employee_code: '', designation: '', department: '', date_of_joining: '', gender: '' };

export default function Employees() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.employees({ page, limit: 15, search });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const save = async () => {
    if (!form.name || !form.email || !form.employee_code) return toast.error('Name, email and employee code are required');
    if (modal === 'new' && (!form.password || form.password.length < 6)) return toast.error('Password min 6 chars required');
    setSaving(true);
    try {
      if (modal === 'new') {
        await hrApi.createEmployee(form);
        toast.success('Employee created');
      } else {
        await hrApi.updateEmployee(modal.id, form);
        toast.success('Employee updated');
      }
      setModal(null); setForm(EMPTY); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Human Resources
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Employees</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} employees on record</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => { setForm(EMPTY); setModal('new'); }}>Add Employee</Button>
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search name, email or code…"
            className="flex-1 min-w-[220px]"
          />
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { v: 'table', icon: List, label: 'Table view' },
              { v: 'grid', icon: LayoutGrid, label: 'Grid view' },
            ].map((v) => (
              <button
                key={v.v}
                onClick={() => setView(v.v)}
                title={v.label}
                aria-label={v.label}
                className={cx(
                  'p-1.5 rounded-lg transition-all duration-150',
                  view === v.v ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {search && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          {view === 'table' ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No employees"
            message="Employee records appear here — they can log in to the employee app."
            action={
              search ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setPage(1); }}>Clear search</Button>
              ) : (
                <Button icon={Plus} onClick={() => { setForm(EMPTY); setModal('new'); }}>Add Employee</Button>
              )
            }
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Employee</TH>
                <TH className="hidden md:table-cell">Department</TH>
                <TH className="hidden lg:table-cell">Designation</TH>
                <TH className="hidden lg:table-cell">Joined</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <TRow key={e.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{e.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <IdCard className="w-3 h-3" /> {e.employee_code}
                          <span className="text-slate-300">·</span>
                          <Mail className="w-3 h-3" /> <span className="truncate">{e.email}</span>
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell text-sm">{e.department || '—'}</TD>
                  <TD className="hidden lg:table-cell text-sm">{e.designation || '—'}</TD>
                  <TD className="hidden lg:table-cell text-sm text-slate-500">{fmtDate(e.date_of_joining)}</TD>
                  <TD><StatusBadge status={e.status} /></TD>
                  <TD align="right">
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => { setForm({ ...EMPTY, name: e.name, email: e.email, phone: e.phone || '', employee_code: e.employee_code, designation: e.designation || '', department: e.department || '', date_of_joining: e.date_of_joining || '', gender: e.gender || '' }); setModal(e); }}>Edit</Button>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((e, i) => (
              <Card
                key={e.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => { setForm({ ...EMPTY, name: e.name, email: e.email, phone: e.phone || '', employee_code: e.employee_code, designation: e.designation || '', department: e.department || '', date_of_joining: e.date_of_joining || '', gender: e.gender || '' }); setModal(e); }}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <Avatar name={e.name} size="lg" />
                  <StatusBadge status={e.status} />
                </div>
                <h3 className="relative font-display font-bold text-slate-900 text-lg">{e.name}</h3>
                <p className="relative text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <IdCard className="w-3 h-3" /> {e.employee_code}
                </p>
                <div className="relative space-y-1.5 mt-3 text-sm">
                  {e.designation && (
                    <p className="flex items-center gap-1.5 text-slate-600"><BadgeCheck className="w-3.5 h-3.5 text-indigo-400" /> {e.designation}</p>
                  )}
                  {e.department && (
                    <p className="flex items-center gap-1.5 text-slate-600"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {e.department}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{e.email}</span></p>
                  {e.phone && (
                    <p className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {e.phone}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-slate-500 text-xs"><CalendarDays className="w-3 h-3" /> Joined {fmtDate(e.date_of_joining)}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </div>
        </>
      )}

      {/* ============ Create / Edit modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Add employee' : 'Edit employee'}
        subtitle={modal === 'new' ? 'New employee record with app login' : `${modal?.name} · ${modal?.employee_code}`}
        icon={Users}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={modal === 'new' ? Plus : Pencil}>
              {modal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Identity */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Identity
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Full name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Priya Sharma" icon={User} />
              <Input label="Email" required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={modal !== 'new'} icon={Mail} />
              <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} icon={Phone} />
              <Input label="Employee code" required value={form.employee_code} onChange={(e) => set('employee_code', e.target.value)} placeholder="EMP-002" icon={IdCard} />
              <Input label="Designation" value={form.designation} onChange={(e) => set('designation', e.target.value)} icon={BadgeCheck} />
              <Input label="Department" value={form.department} onChange={(e) => set('department', e.target.value)} icon={Building2} />
              <Input label="Date of joining" type="date" value={form.date_of_joining} onChange={(e) => set('date_of_joining', e.target.value)} icon={CalendarDays} />
              <Select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </Select>
            </div>
          </div>
          {/* Access */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" /> App access
            </p>
            {modal === 'new' ? (
              <Input label="Password" required type="password" value={form.password} onChange={(e) => set('password', e.target.value)} hint="Min 6 characters" icon={KeyRound} />
            ) : (
              <Input label="Reset password (optional)" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} hint="Leave blank to keep current" icon={KeyRound} />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
