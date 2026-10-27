import { useCallback, useEffect, useState } from 'react';
import {
  FileText, RotateCcw, CheckCircle2, XCircle, MessageSquare, Eye,
  SearchX, List, LayoutGrid, Building2, CalendarDays, Hash, AlertTriangle,
  Check, Send, ClipboardList,
} from 'lucide-react';
import { quotationsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, StatusBadge, EmptyState, useToast, Modal, Textarea, TableSkeleton,
} from '../../components/ui';
import { fmtDate, fmtMoney, timeAgo, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'accepted', label: 'Accepted', dot: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
  { value: 'clarification_requested', label: 'Clarification', dot: 'bg-violet-500' },
];

export default function Quotations() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsApi.list({ page, limit: 15, search, status });
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

  const openDetail = async (id) => {
    try {
      const res = await quotationsApi.get(id);
      setDetail(res.data.data);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const submitDecision = async () => {
    setSaving(true);
    try {
      await quotationsApi.review(detail.id, { decision, note });
      toast.success(`Quotation ${decision.replace('_', ' ')}`);
      setDecision(null);
      setDetail(null);
      setNote('');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Operations</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Quotations</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{total}</span> quotations from vendors
            </p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Status chips ============ */}
      <div className="mb-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
          {STATUS_TABS.map((t) => {
            const active = status === t.value;
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
            placeholder="Search quotation or request ticket…"
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
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
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
                <div key={i} className="skeleton h-48 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No quotations found"
            message="Vendor quotations appear here once submitted."
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
                <TH>Quotation</TH>
                <TH>Request</TH>
                <TH className="hidden md:table-cell">Vendor</TH>
                <TH>Total</TH>
                <TH>Status</TH>
                <TH className="hidden lg:table-cell">Date</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <TRow key={q.id} onClick={() => openDetail(q.id)}>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-2 py-1 font-mono text-xs font-bold text-emerald-700">
                      <Hash className="w-3 h-3" /> {q.ticket_no}
                    </span>
                  </TD>
                  <TD>
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{q.request_title}</p>
                    <p className="text-xs text-slate-500 font-mono">{q.request_ticket}</p>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {q.vendor_name}
                    </span>
                  </TD>
                  <TD>
                    <span className="font-display font-bold text-slate-900">{fmtMoney(q.total_amount)}</span>
                  </TD>
                  <TD><StatusBadge status={q.status} /></TD>
                  <TD className="hidden lg:table-cell">
                    <p className="text-slate-600 text-xs">{fmtDate(q.created_at)}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(q.created_at)}</p>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => openDetail(q.id)} title="View"><Eye className="w-4 h-4" /></Button>
                      {q.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => { setDetail(q); setDecision('accepted'); }} title="Accept">
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => { setDetail(q); setDecision('rejected'); }} title="Reject">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
            {items.map((q, i) => (
              <Card
                key={q.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(q.id)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-2 py-1 font-mono text-xs font-bold text-emerald-700">
                    <Hash className="w-3 h-3" /> {q.ticket_no}
                  </span>
                  <StatusBadge status={q.status} />
                </div>
                <p className="relative font-semibold text-slate-900 truncate">{q.request_title}</p>
                <p className="relative text-xs text-slate-500 font-mono truncate mt-0.5">{q.request_ticket}</p>
                <p className="relative text-xs text-slate-500 truncate flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3 h-3 shrink-0" /> {q.vendor_name}
                </p>
                <div className="relative mt-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white px-4 py-3 shadow-lg shadow-emerald-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Total</p>
                  <p className="font-display font-extrabold text-lg">{fmtMoney(q.total_amount)}</p>
                </div>
                <div className="relative flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {fmtDate(q.created_at, 'DD MMM YY')}</span>
                </div>
                {q.status === 'pending' && (
                  <div className="relative flex gap-2 mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="success" icon={Check} className="flex-1" onClick={() => { setDetail(q); setDecision('accepted'); }}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" icon={XCircle} className="flex-1" onClick={() => { setDetail(q); setDecision('rejected'); }}>
                      Reject
                    </Button>
                  </div>
                )}
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
        open={!!detail && !decision}
        onClose={() => setDetail(null)}
        title={detail?.ticket_no}
        subtitle={detail?.vendor_name}
        icon={FileText}
        size="lg"
        footer={
          detail?.status === 'pending' && (
            <>
              <Button variant="danger" icon={XCircle} onClick={() => setDecision('rejected')}>Reject</Button>
              <Button variant="secondary" icon={MessageSquare} onClick={() => setDecision('clarification_requested')}>Need clarification</Button>
              <Button variant="success" icon={CheckCircle2} onClick={() => setDecision('accepted')}>Accept</Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            {/* Amount tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Subtotal', fmtMoney(detail.subtotal)],
                [`Tax (${detail.tax_rate}%)`, fmtMoney(detail.tax_amount)],
                ['Discount', fmtMoney(detail.discount)],
                ['Total', fmtMoney(detail.total_amount)],
              ].map(([l, v], i) => (
                <div key={i} className={cx(
                  'rounded-2xl p-4',
                  i === 3
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-50 ring-1 ring-slate-100'
                )}>
                  <p className={cx('text-[10px] font-bold uppercase tracking-wider', i === 3 ? 'text-white/80' : 'text-slate-500')}>{l}</p>
                  <p className={cx('font-display font-extrabold text-lg mt-0.5', i === 3 ? '' : 'text-slate-900')}>{v}</p>
                </div>
              ))}
            </div>

            {/* Line items */}
            {detail.items?.length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <ClipboardList className="w-3.5 h-3.5 text-emerald-500" /> Line items
                </p>
                <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500">Item</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Rate</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.items.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{it.item_name}</p>
                            {it.description && <p className="text-xs text-slate-500">{it.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{it.quantity} {it.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmtMoney(it.rate)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtMoney(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes + validity */}
            {detail.notes && (
              <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.notes}</p>
              </div>
            )}
            {detail.valid_until && (
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-2.5 py-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                Valid until: <b className="text-amber-700">{fmtDate(detail.valid_until)}</b>
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ============ Decision modal ============ */}
      <Modal
        open={!!decision}
        onClose={() => { setDecision(null); setNote(''); }}
        title={
          decision === 'accepted' ? 'Accept quotation?' : decision === 'rejected' ? 'Reject quotation?' : 'Request clarification'
        }
        icon={decision === 'accepted' ? Check : decision === 'rejected' ? AlertTriangle : MessageSquare}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setDecision(null); setNote(''); }}>Cancel</Button>
            <Button variant={decision === 'accepted' ? 'success' : 'danger'} loading={saving} onClick={submitDecision} icon={decision === 'accepted' ? Check : decision === 'rejected' ? XCircle : Send}>
              {decision === 'accepted' ? 'Accept' : decision === 'rejected' ? 'Reject' : 'Send'}
            </Button>
          </>
        }
      >
        <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the vendor…" />
      </Modal>
    </>
  );
}
