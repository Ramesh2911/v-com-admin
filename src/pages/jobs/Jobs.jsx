import { useCallback, useEffect, useState } from 'react';
import {
  Wrench, RotateCcw, CalendarClock, Eye, SearchX, List, LayoutGrid,
  Building2, CalendarDays, Hash, User, MapPin, History, Paperclip,
  CheckCircle2, Clock, Flag, FileText,
} from 'lucide-react';
import { jobsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Select, Button, StatusBadge, EmptyState, useToast, Modal, Textarea,
  Input, TableSkeleton, Badge,
} from '../../components/ui';
import { fmtDate, fmtMoney, mediaUrl, fmtDateTime, timeAgo, cx } from '../../lib/utils';

const STAGE_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'accepted', label: 'Accepted', dot: 'bg-emerald-500' },
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-cyan-500' },
  { value: 'awaiting_approval', label: 'Awaiting Approval', dot: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-teal-500' },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-rose-500' },
];

const STAGE_OPTIONS = ['accepted', 'scheduled', 'in_progress', 'awaiting_approval', 'completed', 'cancelled'];

const historyTone = (s) => {
  if (['completed'].includes(s)) return 'bg-emerald-500 shadow-emerald-500/40';
  if (['in_progress', 'scheduled'].includes(s)) return 'bg-cyan-500 shadow-cyan-500/40';
  if (s === 'cancelled') return 'bg-rose-500 shadow-rose-500/40';
  return 'bg-brand-500 shadow-brand-500/40';
};

export default function Jobs() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [stageCounts, setStageCounts] = useState({});
  const [detail, setDetail] = useState(null);
  const [stageModal, setStageModal] = useState(null);
  const [newStage, setNewStage] = useState('');
  const [note, setNote] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsApi.list({ page, limit: 15, search, stage });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    jobsApi.stats().then((r) => {
      const map = {};
      (r.data.data.by_stage || r.data.data || []).forEach?.((s) => {
        if (s.stage) map[s.stage] = Number(s.count);
      });
      setStageCounts(map);
    }).catch(() => {});
  }, []);

  const openDetail = async (id) => {
    try {
      const res = await jobsApi.get(id);
      setDetail(res.data.data);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const updateStage = async () => {
    if (!newStage) return toast.error('Select a stage');
    setSaving(true);
    try {
      await jobsApi.setStage(stageModal.id, { stage: newStage, note, schedule_date: scheduleDate || undefined });
      toast.success('Stage updated');
      setStageModal(null);
      setNote('');
      setScheduleDate('');
      setDetail(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const openStage = (j) => {
    setStageModal(j);
    setNewStage(j.stage);
    setScheduleDate(j.schedule_date || '');
    setNote('');
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Operations</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Jobs & Orders</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{total}</span> work orders
            </p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stage chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {STAGE_TABS.map((t) => {
            const active = stage === t.value;
            const count = t.value ? stageCounts[t.value] ?? 0 : total;
            return (
              <button
                key={t.value}
                onClick={() => { setStage(t.value); setPage(1); }}
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
                  active ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-200/80 text-slate-500'
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
            placeholder="Search job no, request or vendor…"
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
                    ? 'bg-white text-cyan-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || stage) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStage(''); setPage(1); }} icon={RotateCcw}>
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
                <div key={i} className="skeleton h-56 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No jobs found"
            message="Jobs appear here when vendors start work on approved requests."
            action={
              (search || stage) && (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStage(''); setPage(1); }}>Clear filters</Button>
              )
            }
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Job</TH>
                <TH>Request</TH>
                <TH className="hidden md:table-cell">Vendor</TH>
                <TH>Stage</TH>
                <TH className="hidden lg:table-cell">Schedule</TH>
                <TH align="right">Amount</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <TRow key={j.id} onClick={() => openDetail(j.id)}>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 ring-1 ring-cyan-200 px-2 py-1 font-mono text-xs font-bold text-cyan-700">
                      <Hash className="w-3 h-3" /> {j.job_no}
                    </span>
                  </TD>
                  <TD>
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{j.request_title}</p>
                    <p className="text-xs text-slate-500 font-mono">{j.request_ticket}</p>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {j.vendor_name}
                    </span>
                  </TD>
                  <TD><StatusBadge status={j.stage} /></TD>
                  <TD className="hidden lg:table-cell">
                    {j.schedule_date ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {fmtDate(j.schedule_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not scheduled</span>
                    )}
                  </TD>
                  <TD align="right">
                    <span className="font-display font-bold text-slate-900">{fmtMoney(j.amount)}</span>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" title="View" onClick={() => openDetail(j.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" icon={CalendarClock} onClick={() => openStage(j)}>
                        Stage
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
            {items.map((j, i) => (
              <Card
                key={j.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(j.id)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 ring-1 ring-cyan-200 px-2 py-1 font-mono text-xs font-bold text-cyan-700">
                    <Hash className="w-3 h-3" /> {j.job_no}
                  </span>
                  <StatusBadge status={j.stage} />
                </div>
                <p className="relative font-semibold text-slate-900 truncate">{j.request_title}</p>
                <p className="relative text-xs text-slate-500 font-mono truncate mt-0.5">{j.request_ticket}</p>
                <p className="relative text-xs text-slate-500 truncate flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3 h-3 shrink-0" /> {j.vendor_name}
                </p>
                <div className="relative mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {j.schedule_date ? fmtDate(j.schedule_date, 'DD MMM YY') : 'Not scheduled'}
                  </span>
                </div>
                <div className="relative mt-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white px-4 py-3 shadow-lg shadow-cyan-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Amount</p>
                  <p className="font-display font-extrabold text-lg">{fmtMoney(j.amount)}</p>
                </div>
                <div className="relative flex gap-2 mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="secondary" icon={CalendarClock} className="flex-1" onClick={() => openStage(j)}>
                    Update stage
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
        title={detail?.job_no}
        subtitle={detail?.request_title}
        icon={Wrench}
        size="lg"
        footer={
          <Button variant="secondary" icon={CalendarClock} onClick={() => { setStageModal(detail); setNewStage(detail.stage); setScheduleDate(detail.schedule_date || ''); setNote(''); }}>
            Update stage
          </Button>
        }
      >
        {detail && (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.stage} />
              <Badge tone="brand"><FileText className="w-3 h-3" /> {detail.module_name}</Badge>
              <Badge tone="violet"><Building2 className="w-3 h-3" /> {detail.vendor_name}</Badge>
            </div>

            {/* Info grid */}
            <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4 grid sm:grid-cols-2 gap-x-8">
              <div className="py-2">
                <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-0.5"><User className="w-3 h-3" /> Customer</p>
                <p className="text-sm font-medium text-slate-800">{detail.customer_name} · {detail.customer_phone}</p>
              </div>
              <div className="py-2">
                <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-0.5"><Hash className="w-3 h-3" /> Amount</p>
                <p className="text-sm font-bold text-emerald-600">{fmtMoney(detail.amount)}</p>
              </div>
              <div className="py-2">
                <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-0.5"><CalendarDays className="w-3 h-3" /> Scheduled</p>
                <p className="text-sm font-medium text-slate-800">{fmtDate(detail.schedule_date)}</p>
              </div>
              <div className="py-2">
                <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-0.5"><CheckCircle2 className="w-3 h-3" /> Completed</p>
                <p className="text-sm font-medium text-slate-800">{fmtDateTime(detail.completed_at)}</p>
              </div>
              {detail.site_location && (
                <div className="py-2 sm:col-span-2">
                  <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-0.5"><MapPin className="w-3 h-3" /> Site</p>
                  <p className="text-sm font-medium text-slate-800">{detail.site_location}</p>
                </div>
              )}
            </div>

            {/* Completion notes */}
            {detail.completion_notes && (
              <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-4">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Completion notes</p>
                <p className="text-sm text-emerald-900 mt-1.5 whitespace-pre-wrap">{detail.completion_notes}</p>
              </div>
            )}

            {/* Evidence photos */}
            {detail.attachments?.filter((a) => a.file_type === 'image').length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <Paperclip className="w-3.5 h-3.5 text-cyan-500" /> Evidence photos
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {detail.attachments.filter((a) => a.file_type === 'image').map((a) => (
                    <a key={a.id} href={mediaUrl(a.url)} target="_blank" rel="noreferrer" className="group rounded-xl overflow-hidden ring-1 ring-slate-200 aspect-square">
                      <img src={mediaUrl(a.url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* History timeline */}
            {detail.history?.length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <History className="w-3.5 h-3.5 text-brand-500" /> History
                </p>
                <div className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-brand-300 before:via-slate-200 before:to-transparent">
                  {detail.history.map((h, i) => (
                    <div key={h.id} className="relative pl-6">
                      <span className={cx(
                        'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-md',
                        i === detail.history.length - 1 ? historyTone(h.stage) : 'bg-slate-300'
                      )} />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={h.stage} />
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

      {/* ============ Stage modal ============ */}
      <Modal
        open={!!stageModal}
        onClose={() => setStageModal(null)}
        title="Update job stage"
        subtitle={stageModal?.job_no}
        icon={CalendarClock}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStageModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={updateStage}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stage <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Flag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundPosition: 'right 0.6rem center',
                  backgroundSize: '1.1em',
                }}
              >
                {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <Input label="Schedule date" type="date" icon={CalendarDays} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional stage note…" />
        </div>
      </Modal>
    </>
  );
}
