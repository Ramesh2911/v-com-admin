import { useCallback, useEffect, useState } from 'react';
import {
  Star, SearchX, RotateCcw, Eye, EyeOff, Trash2, MessageSquareText,
  User, Ticket, Wrench,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { reviewsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput, useToast, Modal, Badge,
  StatCard, Select, ConfirmDialog,
} from '../../components/ui';
import { cx, fmtDate } from '../../lib/utils';

const tableStyles = {
  headCells: {
    style: {
      fontSize: '11px',
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#64748b',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      minHeight: '44px',
    },
  },
  cells: {
    style: {
      fontSize: '14px',
      paddingTop: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f1f5f9',
      color: '#0f172a',
    },
  },
  rows: {
    style: {
      minHeight: '64px',
      '&:hover': { backgroundColor: 'rgba(245,158,11,0.05)' },
    },
  },
  table: { style: { fontFamily: 'inherit' } },
};

function Stars({ value, size = 'w-3.5 h-3.5' }) {
  const v = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-0.5" title={`${v} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx(size, i <= Math.round(v) ? 'fill-amber-400 text-amber-400' : 'text-slate-300')}
        />
      ))}
    </span>
  );
}

export default function Reviews() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [detail, setDetail] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (rating) params.rating = rating;
      const first = await reviewsApi.list({ ...params, page: 1, limit: 100 });
      const { items: page1, pagination } = first.data.data;
      let all = page1;
      if (pagination.totalPages > 1) {
        const extra = await Promise.all(
          Array.from({ length: Math.min(pagination.totalPages, 10) - 1 }, (_, i) =>
            reviewsApi.list({ ...params, page: i + 2, limit: 100 })
          )
        );
        all = [...page1, ...extra.flatMap((r) => r.data.data.items)];
      }
      setItems(all);
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setLoading(false);
    }
  }, [status, rating]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (r) => {
    setBusy(true);
    try {
      await reviewsApi.setStatus(r.id, r.status === 'visible' ? 'hidden' : 'visible');
      toast.success(r.status === 'visible' ? 'Review hidden from public' : 'Review is now public');
      setDetail(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    try {
      await reviewsApi.remove(del.id);
      toast.success('Review deleted');
      setDel(null);
      setDetail(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    }
  };

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? items
    : items.filter((r) =>
        `${r.customer_name} ${r.customer_email} ${r.ticket_no} ${r.module_name} ${r.category_name || ''} ${r.vendor_name || ''} ${r.service_comment || ''} ${r.technician_comment || ''}`
          .toLowerCase()
          .includes(term)
      );

  const total = items.length;
  const visibleCount = items.filter((r) => r.status === 'visible').length;
  const avg = total
    ? (items.reduce((s, r) => s + Number(r.service_rating || 0), 0) / total).toFixed(1)
    : '0.0';

  const serviceCell = (r) => (
    <div className="min-w-0 py-0.5">
      <div className="flex items-center gap-2">
        <Stars value={r.service_rating} />
        <span className="text-xs font-bold text-amber-600">{Number(r.service_rating)}.0</span>
      </div>
      <p className="text-sm text-slate-600 truncate max-w-[320px] mt-0.5">
        {r.service_comment || <span className="text-slate-400 italic">No comment</span>}
      </p>
      <p className="text-[11px] text-slate-400 truncate">
        {r.category_name ? `${r.category_name} · ` : ''}{r.module_name}
      </p>
    </div>
  );

  const techCell = (r) =>
    r.vendor_id ? (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Stars value={r.technician_rating} />
          <span className="text-xs font-bold text-violet-600">{Number(r.technician_rating)}.0</span>
        </div>
        <p className="text-xs text-slate-500 truncate max-w-[160px] mt-0.5">{r.vendor_name}</p>
        {r.technician_comment && (
          <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{r.technician_comment}</p>
        )}
      </div>
    ) : (
      <span className="text-xs text-slate-400">—</span>
    );

  const columns = [
    {
      name: 'Service review',
      selector: (r) => r.service_rating,
      sortable: true,
      grow: 2,
      cell: serviceCell,
    },
    {
      name: 'Customer',
      selector: (r) => r.customer_name || '',
      sortable: true,
      width: '170px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{r.customer_name}</p>
          <p className="text-[11px] text-slate-400 truncate">{r.customer_email}</p>
        </div>
      ),
    },
    {
      name: 'Technician',
      selector: (r) => Number(r.technician_rating) || 0,
      sortable: true,
      width: '190px',
      cell: techCell,
    },
    {
      name: 'Request',
      selector: (r) => r.ticket_no || '',
      width: '160px',
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
          <Ticket className="w-3 h-3" /> {r.ticket_no}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '110px',
      cell: (r) =>
        r.status === 'visible' ? (
          <Badge tone="emerald" dot className="font-bold">Public</Badge>
        ) : (
          <Badge tone="slate" dot className="font-bold">Hidden</Badge>
        ),
    },
    {
      name: 'Date',
      selector: (r) => r.created_at,
      sortable: true,
      width: '130px',
      cell: (r) => <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>,
    },
    {
      name: '',
      right: true,
      width: '130px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="View" onClick={() => setDetail(r)}><Eye className="w-4 h-4" /></Button>
          <Button
            size="icon"
            variant="ghost"
            title={r.status === 'visible' ? 'Hide' : 'Show'}
            className={r.status === 'visible' ? 'text-slate-500 hover:bg-slate-100' : 'text-emerald-600 hover:bg-emerald-50'}
            onClick={() => toggleStatus(r)}
            disabled={busy}
          >
            {r.status === 'visible' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Delete"
            className="text-rose-600 hover:bg-rose-50"
            onClick={() => setDel({ id: r.id, name: r.ticket_no })}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
            <Star className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquareText className="w-3 h-3" /> Operations
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Service Reviews</h1>
            <p className="text-sm text-slate-500 mt-0.5">Customer ratings &amp; comments — hide or delete anything inappropriate</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MessageSquareText} label="Total reviews" value={total} tone="brand" delay="0ms" />
        <StatCard icon={Eye} label="Public" value={visibleCount} tone="emerald" delay="60ms" />
        <StatCard icon={EyeOff} label="Hidden" value={total - visibleCount} tone="rose" delay="120ms" />
        <StatCard icon={Star} label="Avg service rating" value={avg} tone="amber" delay="180ms" />
      </div>

      {/* Table */}
      {loading ? (
        <Card className="animate-fade-up">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : total === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={Star}
            title="No reviews yet"
            message="Customers review a service from the app once their request is completed — they will land here automatically."
          />
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Customer reviews</h3>
                <p className="text-sm text-slate-500">{total} reviews · auto-published on submit</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
                <option value="">All statuses</option>
                <option value="visible">Public</option>
                <option value="hidden">Hidden</option>
              </Select>
              <Select value={rating} onChange={(e) => setRating(e.target.value)} className="w-32">
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                ))}
              </Select>
              <SearchInput value={q} onChange={setQ} placeholder="Search reviews…" className="w-full sm:w-64" />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50]}
            highlightOnHover
            pointerOnHover
            onRowClicked={(r) => setDetail(r)}
            noDataComponent={
              <div className="py-12 text-center">
                <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-500">No reviews match your filters</p>
                <button
                  type="button"
                  onClick={() => { setQ(''); setStatus(''); setRating(''); }}
                  className="mt-1 text-xs font-bold text-amber-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            }
            customStyles={tableStyles}
          />
        </Card>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Review detail"
        subtitle={detail?.ticket_no}
        icon={Star}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
            <Button
              variant={detail?.status === 'visible' ? 'secondary' : 'primary'}
              icon={detail?.status === 'visible' ? EyeOff : Eye}
              loading={busy}
              onClick={() => toggleStatus(detail)}
            >
              {detail?.status === 'visible' ? 'Hide from public' : 'Make public'}
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setDel({ id: detail.id, name: detail.ticket_no })}
            >
              Delete
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{detail.customer_name}</p>
                  <p className="text-xs text-slate-500 truncate">{detail.customer_email}</p>
                </div>
              </div>
              {detail.status === 'visible' ? (
                <Badge tone="emerald" dot className="font-bold">Public</Badge>
              ) : (
                <Badge tone="slate" dot className="font-bold">Hidden</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl ring-1 ring-amber-200 bg-amber-50/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">Service rating</p>
                <div className="flex items-center gap-2">
                  <Stars value={detail.service_rating} size="w-4 h-4" />
                  <span className="text-lg font-extrabold text-slate-900">{Number(detail.service_rating)}.0</span>
                </div>
              </div>
              <div className="p-4 rounded-xl ring-1 ring-violet-200 bg-violet-50/60">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-1.5">Technician rating</p>
                {detail.vendor_id ? (
                  <div className="flex items-center gap-2">
                    <Stars value={detail.technician_rating} size="w-4 h-4" />
                    <span className="text-lg font-extrabold text-slate-900">{Number(detail.technician_rating)}.0</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">No technician assigned</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Service comment</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {detail.service_comment || <span className="text-slate-400 italic">No comment</span>}
              </p>
            </div>

            {detail.vendor_id && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Technician comment</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">{detail.vendor_name}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detail.technician_comment || <span className="text-slate-400 italic">No comment</span>}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> {detail.ticket_no}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5" /> {detail.request_title}
              </span>
              <span>{fmtDate(detail.created_at)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={doDelete}
        title="Delete review?"
        message={`Review ${del?.name || ''} will be permanently removed and the vendor rating recalculated.`}
        confirmText="Delete"
      />
    </>
  );
}
