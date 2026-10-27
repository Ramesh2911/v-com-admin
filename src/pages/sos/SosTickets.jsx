import { useCallback, useEffect, useState } from 'react';
import {
  Siren, RotateCcw, MapPin, Phone, Eye, SearchX, List, LayoutGrid,
  Hash, User, Clock, Radio, ShieldAlert, Send, Navigation, CheckCircle2,
} from 'lucide-react';
import { sosApi, staffApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, StatusBadge, EmptyState, useToast, Modal, Textarea,
  Badge, StatCard, TableSkeleton,
} from '../../components/ui';
import { fmtDateTime, fmtDate, labelize, timeAgo, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'open', label: 'Open', dot: 'bg-rose-500' },
  { value: 'acknowledged', label: 'Acknowledged', dot: 'bg-amber-500' },
  { value: 'dispatched', label: 'Dispatched', dot: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-cyan-500' },
  { value: 'resolved', label: 'Resolved', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-slate-400' },
];

const STATUSES = ['open', 'acknowledged', 'dispatched', 'in_progress', 'resolved', 'closed'];

const historyTone = (s) => {
  if (['resolved', 'closed'].includes(s)) return 'bg-emerald-500 shadow-emerald-500/40';
  if (['in_progress', 'dispatched'].includes(s)) return 'bg-cyan-500 shadow-cyan-500/40';
  if (s === 'open') return 'bg-rose-500 shadow-rose-500/40 animate-pulse';
  return 'bg-amber-500 shadow-amber-500/40';
};

export default function SosTickets() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sosApi.list({ page, limit: 15, search, status });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    sosApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
    staffApi.list({ limit: 100 }).then((r) => setStaff(r.data.data.items)).catch(() => {});
  }, []);

  const openDetail = async (id) => {
    try {
      const res = await sosApi.get(id);
      setDetail(res.data.data);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const update = async () => {
    if (!newStatus) return toast.error('Select status');
    setSaving(true);
    try {
      await sosApi.setStatus(modal.id, {
        status: newStatus,
        note,
        assign_to: assignTo ? Number(assignTo) : undefined,
        resolution_notes: ['resolved', 'closed'].includes(newStatus) ? note : undefined,
      });
      toast.success('SOS status updated');
      setModal(null);
      setNote('');
      setDetail(null);
      load();
      sosApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const openRespond = (s) => {
    setModal(s);
    setNewStatus(s.status);
    setAssignTo(s.assigned_to || '');
    setNote('');
  };

  const statusCounts = {};
  (stats?.by_status || []).forEach((s) => (statusCounts[s.status] = Number(s.count)));

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30 flex items-center justify-center shrink-0">
            <Siren className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-400 ring-2 ring-white animate-ping" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" /> Emergency
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">SOS Emergency</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monitor and respond to emergency tickets</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stats ============ */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={ShieldAlert} label="Active SOS" value={stats.active} tone="rose" delay="60ms" />
          {(stats.by_status || []).slice(0, 3).map((s, i) => (
            <StatCard
              key={s.status}
              icon={Siren}
              label={labelize(s.status)}
              value={Number(s.count)}
              tone={s.status === 'resolved' ? 'emerald' : s.status === 'closed' ? 'cyan' : 'amber'}
              delay={`${120 + i * 60}ms`}
            />
          ))}
        </div>
      )}

      {/* ============ Status chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '100ms' }}>
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
                  active ? 'bg-rose-50 text-rose-600' : 'bg-slate-200/80 text-slate-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '140ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search SOS ticket or customer…"
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
                  view === v.v
                    ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || status) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus(''); setPage(1); }} icon={RotateCcw}>
              Clear
            </Button>
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
            title="No SOS tickets"
            message="Emergency tickets raised from the customer app appear here in real time."
            action={
              (search || status) && (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Clear filters</Button>
              )
            }
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Ticket</TH>
                <TH>Customer</TH>
                <TH className="hidden lg:table-cell">Description</TH>
                <TH>Priority</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Raised</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <TRow key={s.id} onClick={() => openDetail(s.id)}>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 ring-1 ring-rose-200 px-2 py-1 font-mono text-xs font-bold text-rose-700">
                      <Hash className="w-3 h-3" /> {s.ticket_no}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-rose-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{s.customer_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{s.customer_phone}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden lg:table-cell max-w-[260px]">
                    <p className="text-sm text-slate-600 truncate">{s.description}</p>
                    {s.address && <p className="text-xs text-slate-400 flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{s.address}</p>}
                  </TD>
                  <TD>
                    <Badge tone={s.priority === 'critical' ? 'rose' : 'amber'} className="font-bold">
                      {s.priority === 'critical' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                      {labelize(s.priority)}
                    </Badge>
                  </TD>
                  <TD><StatusBadge status={s.status} /></TD>
                  <TD className="hidden md:table-cell">
                    <p className="text-slate-600 text-xs">{fmtDate(s.created_at, 'DD MMM YY')}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(s.created_at)}</p>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" title="View" onClick={() => openDetail(s.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="danger" icon={Send} onClick={() => openRespond(s)}>
                        Respond
                      </Button>
                    </div>
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
            {items.map((s, i) => (
              <Card
                key={s.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(s.id)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 ring-1 ring-rose-200 px-2 py-1 font-mono text-xs font-bold text-rose-700">
                    <Hash className="w-3 h-3" /> {s.ticket_no}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="relative flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-full bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-rose-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{s.customer_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{s.customer_phone}</p>
                  </div>
                </div>
                <p className="relative text-sm text-slate-600 truncate mt-3">{s.description}</p>
                {s.address && (
                  <p className="relative text-xs text-slate-400 flex items-center gap-1 truncate mt-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {s.address}
                  </p>
                )}
                <div className="relative flex items-center justify-between mt-3">
                  <Badge tone={s.priority === 'critical' ? 'rose' : 'amber'} className="font-bold">
                    {s.priority === 'critical' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                    {labelize(s.priority)}
                  </Badge>
                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(s.created_at)}
                  </span>
                </div>
                <div className="relative flex gap-2 mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="danger" icon={Send} className="flex-1" onClick={() => openRespond(s)}>
                    Respond
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </div>
        </>
      )}

      {/* ============ Detail modal ============ */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.ticket_no}
        subtitle={`Raised by ${detail?.customer_name}`}
        icon={Siren}
        size="lg"
        footer={<Button variant="danger" icon={Send} onClick={() => openRespond(detail)}>Respond</Button>}
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <Badge tone={detail.priority === 'critical' ? 'rose' : 'amber'} className="font-bold">
                {detail.priority === 'critical' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                {labelize(detail.priority)}
              </Badge>
              {detail.latitude && (
                <a
                  href={`https://maps.google.com/?q=${detail.latitude},${detail.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 ring-1 ring-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-100 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" /> Open location
                </a>
              )}
            </div>

            <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Emergency description
              </p>
              <p className="text-sm text-rose-900 whitespace-pre-wrap">{detail.description}</p>
            </div>

            {detail.address && (
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />{detail.address}
              </p>
            )}

            {detail.resolution_notes && (
              <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolution
                </p>
                <p className="text-sm text-emerald-900 mt-1.5 whitespace-pre-wrap">{detail.resolution_notes}</p>
              </div>
            )}

            {detail.history?.length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" /> Timeline
                </p>
                <div className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-rose-300 before:via-slate-200 before:to-transparent">
                  {detail.history.map((h, i) => (
                    <div key={h.id} className="relative pl-6">
                      <span className={cx(
                        'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-md',
                        i === detail.history.length - 1 ? historyTone(h.status) : 'bg-slate-300'
                      )} />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-[11px] text-slate-400">{fmtDateTime(h.created_at)}</span>
                      </div>
                      {h.note && <p className="text-sm text-slate-600 mt-0.5">{h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============ Respond modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Respond to SOS"
        subtitle={modal?.ticket_no}
        icon={Siren}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" loading={saving} onClick={update} icon={Send}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Radio className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundPosition: 'right 0.6rem center',
                  backgroundSize: '1.1em',
                }}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign responder</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundPosition: 'right 0.6rem center',
                  backgroundSize: '1.1em',
                }}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role_name || s.user_type})</option>)}
              </select>
            </div>
          </div>
          <Textarea label="Notes / resolution" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Action taken, responder dispatched…" />
        </div>
      </Modal>
    </>
  );
}
