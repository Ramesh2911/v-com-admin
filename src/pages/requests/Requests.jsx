import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, RotateCcw, Plus, SearchX, List, LayoutGrid, User,
  Building2, CalendarDays, Zap, Tag, FileText,
} from 'lucide-react';
import { requestsApi, servicesApi, customersApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Select, Button, StatusBadge, EmptyState, PriorityBadge, useToast,
  Input, Textarea, Modal, TableSkeleton, Label,
} from '../../components/ui';
import { fmtDate, timeAgo, labelize, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'pending_review', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'assigned', label: 'Assigned', dot: 'bg-blue-500' },
  { value: 'quoted', label: 'Quoted', dot: 'bg-violet-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-cyan-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-slate-400' },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-rose-500' },
];

const PRIORITY_PILL = {
  urgent: 'bg-rose-50 ring-rose-300 text-rose-700',
  high: 'bg-orange-50 ring-orange-300 text-orange-700',
  normal: 'bg-blue-50 ring-blue-300 text-blue-700',
  low: 'bg-slate-100 ring-slate-300 text-slate-600',
};

export default function Requests() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [priority, setPriority] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await requestsApi.list({ page, limit: 15, search, status, module_id: moduleId, priority });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, moduleId, priority]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    servicesApi.modules().then((r) => setModules(r.data.data)).catch(() => {});
    requestsApi.stats().then((r) => {
      const map = {};
      r.data.data.by_status.forEach((s) => (map[s.status] = Number(s.count)));
      setStatusCounts(map);
    }).catch(() => {});
  }, []);

  const clearFilters = () => {
    setSearch(''); setStatus(''); setModuleId(''); setPriority(''); setPage(1);
  };
  const hasFilters = search || status || moduleId || priority;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center shrink-0">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Operations</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Requests & Enquiries</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{total}</span> service requests across all modules
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>New Request</Button>
        </div>
      </div>

      {/* ============ Status chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {STATUS_TABS.map((t) => {
            const active = status === t.value;
            const count = t.value ? statusCounts[t.value] ?? 0 : total;
            return (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1); }}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                {t.label}
                <span className={cx(
                  'ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-amber-50 text-amber-600' : 'bg-slate-200/80 text-slate-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search ticket, title, customer…"
            className="flex-1 min-w-[220px]"
          />
          <Select value={moduleId} onChange={(e) => { setModuleId(e.target.value); setPage(1); }} className="w-44">
            <option value="">All modules</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="w-40">
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
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
                  view === v.v
                    ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} icon={RotateCcw}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          {view === 'table' ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-52 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No requests found"
            message="Customer enquiries and admin-created requests appear here."
            action={hasFilters && <Button variant="secondary" icon={RotateCcw} onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Ticket</TH>
                <TH>Request</TH>
                <TH className="hidden lg:table-cell">Customer</TH>
                <TH className="hidden md:table-cell">Vendor</TH>
                <TH>Priority</TH>
                <TH>Status</TH>
                <TH className="hidden xl:table-cell">Date</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <TRow key={r.id} onClick={() => navigate(`/requests/${r.id}`)}>
                  <TD>
                    <p className="font-mono text-xs font-bold text-brand-600">{r.ticket_no}</p>
                    <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 ring-1 ring-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {labelize(r.module_code)}
                    </span>
                  </TD>
                  <TD className="max-w-[240px]">
                    <p className="font-semibold text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500 truncate">{r.category_name || r.city || '—'}</p>
                  </TD>
                  <TD className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-brand-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.customer_name}</p>
                        <p className="text-xs text-slate-500">{r.customer_phone}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell text-sm">
                    {r.vendor_name ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {r.vendor_name}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 ring-1 ring-slate-200 rounded-lg px-2 py-0.5">Unassigned</span>
                    )}
                  </TD>
                  <TD><PriorityBadge priority={r.priority} /></TD>
                  <TD><StatusBadge status={r.status} /></TD>
                  <TD className="hidden xl:table-cell">
                    <p className="text-slate-600 text-xs">{fmtDate(r.created_at)}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(r.created_at)}</p>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((r, i) => (
              <Card
                key={r.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/requests/${r.id}`)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-brand-600">{r.ticket_no}</p>
                    <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 ring-1 ring-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {labelize(r.module_code)}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="relative font-semibold text-slate-900 truncate">{r.title}</p>
                <p className="relative text-xs text-slate-500 truncate mt-0.5">{r.category_name || r.city || '—'}</p>
                <div className="relative flex flex-wrap items-center gap-2 mt-3">
                  <PriorityBadge priority={r.priority} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 ring-1 ring-slate-100 rounded-lg px-2 py-1">
                    <User className="w-3 h-3" /> {r.customer_name}
                  </span>
                  {r.vendor_name ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 ring-1 ring-slate-100 rounded-lg px-2 py-1 truncate max-w-[140px]">
                      <Building2 className="w-3 h-3 shrink-0" /> {r.vendor_name}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 ring-1 ring-slate-200 rounded-lg px-2 py-1">Unassigned</span>
                  )}
                </div>
                <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {fmtDate(r.created_at, 'DD MMM YY')}</span>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </div>
        </>
      )}

      <CreateRequestModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); }} modules={modules} />
    </>
  );
}

function CreateRequestModal({ open, onClose, onDone, modules }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', module_id: '', priority: 'normal', site_location: '', customer_id: '' });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      customersApi.list({ limit: 100 }).then((r) => setCustomers(r.data.data.items)).catch(() => {});
    }
  }, [open]);

  const submit = async () => {
    if (!form.title || !form.module_id || !form.customer_id) return toast.error('Customer, module and title are required');
    setLoading(true);
    try {
      await requestsApi.create(form);
      toast.success('Request created');
      setForm({ title: '', description: '', module_id: '', priority: 'normal', site_location: '', customer_id: '' });
      onDone();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create request"
      subtitle="Log an offline / phone enquiry"
      icon={FileText}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={submit} icon={Plus}>Create request</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Who + What */}
        <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-4">
            <span className="h-6 w-6 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
              <User className="w-3.5 h-3.5 text-brand-600" />
            </span>
            Customer & Service
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label required>Customer</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.customer_id}
                  onChange={(e) => set('customer_id', e.target.value)}
                  className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.6rem center',
                    backgroundSize: '1.1em',
                  }}
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label required>Service module</Label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.module_id}
                  onChange={(e) => set('module_id', e.target.value)}
                  className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 0.6rem center',
                    backgroundSize: '1.1em',
                  }}
                >
                  <option value="">Select module…</option>
                  {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-4">
            <span className="h-6 w-6 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
              <FileText className="w-3.5 h-3.5 text-violet-600" />
            </span>
            Details
          </p>
          <div className="space-y-4">
            <Input label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. CCTV installation for 2nd floor" />
            <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Scope, requirements, access details…" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Site location" value={form.site_location} onChange={(e) => set('site_location', e.target.value)} placeholder="Full site address" />
              <div>
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {['low', 'normal', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set('priority', p)}
                      className={cx(
                        'flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold ring-1 transition-all duration-150 capitalize',
                        form.priority === p
                          ? PRIORITY_PILL[p]
                          : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300 hover:text-slate-700'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
