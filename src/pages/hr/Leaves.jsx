import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList, RotateCcw, CheckCircle2, XCircle, CalendarDays, Clock,
  User, MessageSquare, Flag, Building2, CalendarRange, Sun,
  HeartPulse, Gift, Layers,
} from 'lucide-react';
import { hrApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Table, TH, TD, TRow, Pagination, Button,
  EmptyState, useToast, Modal, Textarea, StatusBadge, Badge,
  TableSkeleton,
} from '../../components/ui';
import { fmtDate, labelize, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
];

const LEAVE_ICONS = {
  casual: Sun,
  sick: HeartPulse,
  earned: Gift,
  unpaid: CalendarRange,
};

export default function Leaves() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.leaves({ page, limit: 15, status: status || undefined });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setSaving(true);
    try {
      await hrApi.reviewLeave(review.id, { decision, review_note: note });
      toast.success(`Leave ${decision}`);
      setReview(null); setNote(''); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const openReview = (l, d) => { setReview(l); setDecision(d); setNote(''); };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Human Resources
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Leave Requests</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} leave applications</p>
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

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up"><TableSkeleton rows={8} cols={7} /></Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={ClipboardList}
            title="No leave requests"
            message="Employee leave applications appear here for approval."
            action={status && (
              <Button variant="secondary" icon={RotateCcw} onClick={() => { setStatus(''); setPage(1); }}>Clear filter</Button>
            )}
          />
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Leave</TH>
                <TH>Employee</TH>
                <TH>Type</TH>
                <TH>Dates</TH>
                <TH>Days</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => {
                const LIcon = LEAVE_ICONS[l.leave_type] || Layers;
                return (
                  <TRow key={l.id}>
                    <TD>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-2 py-1 font-mono text-xs font-bold text-amber-700">
                        <Flag className="w-3 h-3" /> {l.leave_no}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-7 rounded-full bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{l.name}</p>
                          <p className="text-xs text-slate-500">{l.employee_code}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone="violet" className="font-bold">
                        <LIcon className="w-3 h-3" /> {labelize(l.leave_type)}
                      </Badge>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {fmtDate(l.from_date, 'DD MMM')} → {fmtDate(l.to_date, 'DD MMM YY')}
                      </span>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> {l.total_days}
                      </span>
                    </TD>
                    <TD><StatusBadge status={l.status} /></TD>
                    <TD align="right">
                      {l.status === 'pending' ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Approve" className="text-emerald-600 hover:bg-emerald-50" onClick={() => openReview(l, 'approved')}><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" title="Reject" className="text-rose-600 hover:bg-rose-50" onClick={() => openReview(l, 'rejected')}><XCircle className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 pr-2">by {l.reviewer_name || '—'}</span>
                      )}
                    </TD>
                  </TRow>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      )}

      {/* ============ Review modal ============ */}
      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={`Review ${review?.leave_no}`}
        subtitle={`${review?.name} · ${review?.total_days} day(s)`}
        icon={ClipboardList}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReview(null)}>Cancel</Button>
            <Button
              variant={decision === 'approved' ? 'success' : 'danger'}
              loading={saving}
              onClick={submit}
              icon={decision === 'approved' ? CheckCircle2 : XCircle}
            >
              {decision === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Decision pills */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'approved', label: 'Approve', icon: CheckCircle2, active: 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500', idle: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100', iconCls: 'text-emerald-500' },
              { v: 'rejected', label: 'Reject', icon: XCircle, active: 'bg-rose-50 text-rose-700 ring-2 ring-rose-500', idle: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100', iconCls: 'text-rose-500' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setDecision(o.v)}
                className={cx(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  decision === o.v ? o.active : o.idle
                )}
              >
                <o.icon className={cx('w-4 h-4', o.iconCls)} />
                {o.label}
              </button>
            ))}
          </div>
          {/* Summary */}
          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="violet" className="font-bold">{labelize(review?.leave_type)}</Badge>
              <StatusBadge status={review?.status} />
            </div>
            <p className="flex items-center gap-2 text-slate-600">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {fmtDate(review?.from_date)} → {fmtDate(review?.to_date)}
              <span className="text-xs text-slate-400">({review?.total_days} day(s))</span>
            </p>
            {review?.reason && (
              <div className="pt-2 border-t border-slate-200">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <MessageSquare className="w-3 h-3 text-amber-500" /> Reason
                </p>
                <p className="text-slate-700 whitespace-pre-wrap">{review.reason}</p>
              </div>
            )}
          </div>
          <Textarea label="Review note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the employee…" />
        </div>
      </Modal>
    </>
  );
}
