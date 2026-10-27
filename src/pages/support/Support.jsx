import { useCallback, useEffect, useState } from 'react';
import {
  LifeBuoy, RotateCcw, MessageSquare, CheckCircle2, Clock, SearchX,
  User, Hash, Send, Headphones, ChevronRight, Tag,
} from 'lucide-react';
import { supportApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, EmptyState, useToast, Modal, StatusBadge,
  TableSkeleton, Badge, Textarea, PriorityBadge, Avatar,
} from '../../components/ui';
import { fmtDateTime, timeAgo, labelize, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'open', label: 'Open', dot: 'bg-rose-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-cyan-500' },
  { value: 'resolved', label: 'Resolved', dot: 'bg-emerald-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-slate-400' },
];

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const statusDot = {
  open: 'bg-rose-500 shadow-rose-500/40',
  in_progress: 'bg-cyan-500 shadow-cyan-500/40',
  resolved: 'bg-emerald-500 shadow-emerald-500/40',
  closed: 'bg-slate-400 shadow-slate-400/40',
};

const USER_TYPE_TONES = {
  customer: 'violet',
  staff: 'cyan',
  employee: 'amber',
  vendor: 'emerald',
};

export default function Support() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supportApi.list({ page, limit: 15, status: status || undefined, search });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, status, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const setStatusLocal = async (id, next) => {
    setSaving(true);
    try {
      await supportApi.setStatus(id, next);
      toast.success('Status updated');
      setDetail((d) => (d ? { ...d, status: next } : d));
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const sendReply = async () => {
    if (!reply.trim()) return toast.error('Reply cannot be empty');
    setSaving(true);
    try {
      await supportApi.reply(detail.id, { reply: reply.trim() });
      toast.success('Reply sent');
      setReply('');
      setDetail({ ...detail, reply: reply.trim(), status: 'in_progress', replied_at: new Date().toISOString() });
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/30 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <Headphones className="w-3 h-3" /> Helpdesk
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Support Tickets</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} tickets from customers, vendors &amp; employees</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
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
        <CardBody>
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search ticket no, subject or name…"
          />
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up"><TableSkeleton rows={8} cols={6} /></Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No support tickets"
            message="All quiet — no tickets match this filter."
            action={(search || status) && (
              <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Clear filters</Button>
            )}
          />
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Ticket</TH>
                <TH>Subject</TH>
                <TH>Raised by</TH>
                <TH className="hidden md:table-cell">Created</TH>
                <TH>Priority</TH>
                <TH>Status</TH>
                <TH align="right"></TH>
              </tr>
            </thead>
            <tbody>
              {items.map((t, i) => (
                <TRow
                  key={t.id}
                  onClick={() => { setDetail(t); setReply(''); }}
                  className="group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                >
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 ring-1 ring-rose-200 px-2 py-1 font-mono text-xs font-bold text-rose-700">
                      <Hash className="w-3 h-3" /> {t.ticket_no}
                    </span>
                  </TD>
                  <TD className="text-sm font-medium text-slate-900 max-w-[280px] truncate">{t.subject}</TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.user_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{t.user_name || '—'}</p>
                        <Badge tone={USER_TYPE_TONES[t.user_type] || 'slate'} className="mt-0.5 text-[10px] font-bold">
                          {labelize(t.user_type || 'customer')}
                        </Badge>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <p className="text-xs text-slate-600" title={fmtDateTime(t.created_at)}>{timeAgo(t.created_at)}</p>
                  </TD>
                  <TD><PriorityBadge priority={t.priority} /></TD>
                  <TD><StatusBadge status={t.status} /></TD>
                  <TD align="right">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      )}

      {/* ============ Detail chat modal (eye-catch) ============ */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.subject}
        subtitle={detail ? `${detail.ticket_no} · ${fmtDateTime(detail.created_at)}` : ''}
        icon={LifeBuoy}
        size="xl"
        footer={
          detail && (
            <>
              {/* status pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mr-auto">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving}
                    onClick={() => setStatusLocal(detail.id, s)}
                    className={cx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                      detail.status === s
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'
                    )}
                  >
                    <span className={cx('h-1.5 w-1.5 rounded-full shadow-sm', statusDot[s])} />
                    {labelize(s)}
                  </button>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
              <Button onClick={() => setStatusLocal(detail.id, 'resolved')} variant="success" icon={CheckCircle2} loading={saving}>Resolve</Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            {/* chips */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={detail.status} />
              <PriorityBadge priority={detail.priority} />
              <Badge><Tag className="w-3 h-3" /> {labelize(detail.category || 'general')}</Badge>
              <Badge tone={USER_TYPE_TONES[detail.user_type] || 'violet'} className="font-bold">
                <User className="w-3 h-3" /> {labelize(detail.user_type)}
              </Badge>
            </div>

            {/* ---------- chat thread ---------- */}
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-4 space-y-5">
              {/* customer bubble */}
              <div className="flex items-start gap-3">
                <Avatar name={detail.user_name} size="md" />
                <div className="min-w-0 max-w-[85%]">
                  <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                    {detail.user_name || 'Requester'}
                    <span className="font-normal text-slate-400">· {timeAgo(detail.created_at)}</span>
                  </p>
                  <div className="rounded-2xl rounded-tl-md bg-white ring-1 ring-slate-200 shadow-sm px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {detail.message}
                  </div>
                </div>
              </div>

              {/* staff reply bubble */}
              {detail.reply ? (
                <div className="flex items-start gap-3 flex-row-reverse">
                  <span className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 shadow-md shadow-brand-500/20 flex items-center justify-center shrink-0 ring-2 ring-white">
                    <Headphones className="w-4.5 h-4.5 text-white" />
                  </span>
                  <div className="min-w-0 max-w-[85%]">
                    <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5 justify-end">
                      <span className="font-normal text-slate-400">
                        {detail.replied_at ? fmtDateTime(detail.replied_at) : ''}
                      </span>
                      · {detail.assignee_name || 'Staff'}
                    </p>
                    <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/20 px-4 py-3 text-sm whitespace-pre-wrap break-words">
                      {detail.reply}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3">
                  <span className="h-8 w-8 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </span>
                  <p className="text-sm text-slate-400">No reply yet — respond below.</p>
                </div>
              )}
            </div>

            {/* ---------- composer ---------- */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" /> Add reply
              </p>
              <Textarea
                label=""
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply to the requester…"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" icon={Send} loading={saving} onClick={sendReply} className="btn-shine relative overflow-hidden">
                  Send reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
