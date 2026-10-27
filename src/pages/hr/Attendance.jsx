import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck, RotateCcw, Plus, SearchX, CalendarDays, LogIn,
  LogOut, StickyNote, Building2, ClipboardCheck,
} from 'lucide-react';
import { hrApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, EmptyState, useToast, Modal, Input, StatusBadge,
  TableSkeleton, Select, Avatar,
} from '../../components/ui';
import { fmtDate, fmtTime, cx, labelize } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All records', dot: null },
  { value: 'present', label: 'Present', dot: 'bg-emerald-500' },
  { value: 'absent', label: 'Absent', dot: 'bg-rose-500' },
  { value: 'leave', label: 'On Leave', dot: 'bg-violet-500' },
  { value: 'half_day', label: 'Half Day', dot: 'bg-amber-500' },
];

const STATUS_OPTIONS = ['present', 'absent', 'half_day', 'leave', 'holiday'];

const statusDot = {
  present: 'bg-emerald-500 shadow-emerald-500/40',
  absent: 'bg-rose-500 shadow-rose-500/40',
  half_day: 'bg-amber-500 shadow-amber-500/40',
  leave: 'bg-violet-500 shadow-violet-500/40',
  holiday: 'bg-cyan-500 shadow-cyan-500/40',
};

export default function Attendance() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ employee_id: '', attendance_date: '', check_in: '', check_out: '', status: 'present', notes: '' });
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.attendance({ page, limit: 15, date: date || undefined, status: status || undefined });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, date, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (modal) hrApi.employees({ limit: 100 }).then((r) => setEmployees(r.data.data.items)).catch(() => {});
  }, [modal]);

  const save = async () => {
    if (!form.employee_id || !form.attendance_date) return toast.error('Employee and date required');
    setSaving(true);
    try {
      await hrApi.markAttendance(form);
      toast.success('Attendance saved');
      setModal(false); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const openMark = () => {
    setForm({ employee_id: '', attendance_date: '', check_in: '', check_out: '', status: 'present', notes: '' });
    setModal(true);
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Human Resources
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} attendance records</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openMark}>Mark Attendance</Button>
        </div>
      </div>

      {/* ============ Status chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {STATUS_TABS.map((t) => {
            const active = status === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1); }}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-full rounded-xl border-0 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition"
            />
          </div>
          {(date || status) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setDate(''); setStatus(''); setPage(1); }}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up"><TableSkeleton rows={8} cols={6} /></Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No attendance records"
            message="Daily attendance records appear here — mark attendance to get started."
            action={
              (date || status) ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setDate(''); setStatus(''); setPage(1); }}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={openMark}>Mark Attendance</Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Employee</TH>
                <TH>Date</TH>
                <TH className="hidden md:table-cell">Check-in</TH>
                <TH className="hidden md:table-cell">Check-out</TH>
                <TH>Status</TH>
                <TH className="hidden lg:table-cell">Notes</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <TRow key={a.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={a.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.employee_code}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-sm">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {fmtDate(a.attendance_date)}
                    </span>
                  </TD>
                  <TD className="hidden md:table-cell">
                    {a.check_in ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <LogIn className="w-3.5 h-3.5" /> {fmtTime(a.check_in)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </TD>
                  <TD className="hidden md:table-cell">
                    {a.check_out ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500">
                        <LogOut className="w-3.5 h-3.5" /> {fmtTime(a.check_out)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </TD>
                  <TD><StatusBadge status={a.status} /></TD>
                  <TD className="hidden lg:table-cell">
                    {a.notes ? (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <StickyNote className="w-3 h-3" /> {a.notes}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      )}

      {/* ============ Mark modal ============ */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Mark attendance"
        subtitle="Record a single attendance entry"
        icon={ClipboardCheck}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={ClipboardCheck}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Employee" required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">Select…</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
          </Select>
          <Input label="Date" type="date" required value={form.attendance_date} onChange={(e) => setForm({ ...form, attendance_date: e.target.value })} icon={CalendarDays} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check-in" type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} icon={LogIn} />
            <Input label="Check-out" type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} icon={LogOut} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                    form.status === s
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <span className={cx('h-1.5 w-1.5 rounded-full shadow-sm', statusDot[s])} />
                  {labelize(s)}
                </button>
              ))}
            </div>
          </div>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional note…" icon={StickyNote} />
        </div>
      </Modal>
    </>
  );
}
