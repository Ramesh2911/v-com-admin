import { useCallback, useEffect, useState } from 'react';
import {
  Recycle, RotateCcw, SearchX, Truck, IndianRupee, Ticket, ExternalLink,
  UserCheck, ArrowRightCircle,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { scrapApi } from '../../api/endpoints';
import api, { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Badge, Select, StatCard, Input, Textarea,
} from '../../components/ui';
import { fmtDate } from '../../lib/utils';

const tableStyles = {
  headCells: {
    style: {
      fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', minHeight: '44px',
    },
  },
  cells: {
    style: { fontSize: '14px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' },
  },
  rows: { style: { minHeight: '64px', '&:hover': { backgroundColor: 'rgba(56,189,248,0.05)' } } },
  table: { style: { fontFamily: 'inherit' } },
};

const STATUS_TONE = {
  REQUEST_PLACED: 'sky',
  BUYER_ASSIGNED: 'violet',
  OUT_FOR_PICKUP: 'amber',
  WEIGHING_COMPLETED: 'cyan',
  PAYMENT_COMPLETED: 'emerald',
  CANCELLED: 'rose',
};

const NEXT_OPTIONS = {
  REQUEST_PLACED: [],
  BUYER_ASSIGNED: ['OUT_FOR_PICKUP', 'CANCELLED'],
  OUT_FOR_PICKUP: ['WEIGHING_COMPLETED', 'CANCELLED'],
  WEIGHING_COMPLETED: ['PAYMENT_COMPLETED', 'CANCELLED'],
  PAYMENT_COMPLETED: [],
  CANCELLED: [],
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function ScrapRequests() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [assignRow, setAssignRow] = useState(null);
  const [assignBuyer, setAssignBuyer] = useState('');
  const [statusRow, setStatusRow] = useState(null);
  const [form, setForm] = useState({ status: '', actual_weight_kg: '', final_amount: '', payment_mode: 'UPI', cancellation_reason: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      scrapApi.stats().catch(() => null),
      scrapApi.requests({ page: 1, limit: 100 }).catch(() => null),
      scrapApi.buyers().catch(() => null),
    ])
      .then(([s, r, b]) => {
        if (s) setStats(s.data.data);
        if (r) setItems(r.data.data?.items || []);
        if (b) setBuyers(b.data.data || []);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const openStatus = (r) => {
    const opts = NEXT_OPTIONS[r.status] || [];
    setStatusRow(r);
    setForm({ status: opts[0] || '', actual_weight_kg: '', final_amount: '', payment_mode: 'UPI', cancellation_reason: '' });
  };

  const applyStatus = async () => {
    if (!form.status) return;
    setSaving(true);
    try {
      const body = { status: form.status };
      if (form.status === 'WEIGHING_COMPLETED') {
        body.actual_weight_kg = Number(form.actual_weight_kg);
        body.final_amount = Number(form.final_amount);
      }
      if (form.status === 'PAYMENT_COMPLETED') body.payment_mode = form.payment_mode;
      if (form.status === 'CANCELLED' && form.cancellation_reason) body.cancellation_reason = form.cancellation_reason;
      await scrapApi.setStatus(statusRow.request_code, body);
      toast.success(`Request marked ${form.status}`);
      setStatusRow(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setSaving(false);
    }
  };

  const applyAssign = async () => {
    if (!assignBuyer) return;
    setSaving(true);
    try {
      await scrapApi.assign(assignRow.request_code, Number(assignBuyer));
      toast.success('Buyer assigned successfully');
      setAssignRow(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const s = q.toLowerCase();
    return !q || (r.request_code || '').toLowerCase().includes(s)
      || (r.customer_name || '').toLowerCase().includes(s)
      || (r.pickup_address || '').toLowerCase().includes(s)
      || (r.buyer_name || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      name: 'Request',
      selector: (r) => r.request_code,
      sortable: true,
      minWidth: '165px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-sky-700">{r.request_code}</p>
          <p className="text-xs text-slate-500 truncate">{r.customer_name || '—'} · {r.contact_phone}</p>
        </div>
      ),
    },
    {
      name: 'Materials / Load',
      selector: (r) => (r.materials || []).join(', '),
      sortable: true,
      minWidth: '210px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{(r.materials || []).join(', ')}</p>
          <p className="text-xs text-slate-500">{r.approx_weight_range} · {r.pickup_type}</p>
        </div>
      ),
    },
    {
      name: 'Slot',
      selector: (r) => r.preferred_date,
      sortable: true,
      width: '175px',
      cell: (r) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{r.preferred_date}</p>
          <p className="text-slate-500">{r.preferred_time_slot}</p>
        </div>
      ),
    },
    {
      name: 'Buyer',
      selector: (r) => r.buyer_name || '',
      sortable: true,
      minWidth: '160px',
      cell: (r) => (
        r.assigned_buyer_id ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {r.buyer_name}
            </p>
            <p className="text-xs text-slate-500 truncate">{r.buyer_vehicle_no || r.buyer_phone || ''}</p>
          </div>
        ) : <span className="text-xs font-semibold text-slate-400">Unassigned</span>
      ),
    },
    {
      name: 'Result',
      selector: (r) => Number(r.final_amount) || 0,
      sortable: true,
      width: '130px',
      cell: (r) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{r.actual_weight_kg ? `${r.actual_weight_kg} kg` : '—'}</p>
          <p className="text-slate-500">{r.final_amount ? `${inr(r.final_amount)}${r.payment_mode ? ` · ${r.payment_mode}` : ''}` : 'Not weighed'}</p>
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '175px',
      cell: (r) => <Badge tone={STATUS_TONE[r.status] || 'slate'} dot className="font-bold">{r.status}</Badge>,
    },
    {
      name: '',
      right: true,
      width: '135px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="View details" onClick={() => setDetail(r)}><ExternalLink className="w-4 h-4" /></Button>
          {r.status === 'REQUEST_PLACED' && (
            <Button size="icon" variant="ghost" title="Assign buyer" onClick={() => { setAssignRow(r); setAssignBuyer(''); }}><UserCheck className="w-4 h-4" /></Button>
          )}
          {(NEXT_OPTIONS[r.status] || []).length > 0 && (
            <Button size="icon" variant="ghost" title="Advance status" onClick={() => openStatus(r)}><ArrowRightCircle className="w-4 h-4" /></Button>
          )}
        </div>
      ),
    },
  ];

  const serverBase = api.defaults.baseURL.replace(/\/api\/v1\/?$/, '');
  const photoHref = detail?.scrap_photo_url
    ? (/^https?:/i.test(detail.scrap_photo_url) ? detail.scrap_photo_url : `${serverBase}${detail.scrap_photo_url}`)
    : null;

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30 flex items-center justify-center shrink-0">
            <Recycle className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Doorstep scrap pickup, weighing & payment
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Scrap Pickups</h1>
            <p className="text-sm text-slate-500 mt-0.5">Assign buyers, weigh, collect payment</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Recycle} label="Total requests" value={stats?.total_requests ?? '—'} tone="brand" delay="0ms" />
        <StatCard icon={Truck} label="Out for pickup" value={stats?.out_for_pickup ?? '—'} tone="amber" delay="60ms" />
        <StatCard icon={ArrowRightCircle} label="Awaiting assign" value={stats?.placed ?? '—'} tone="cyan" delay="120ms" />
        <StatCard icon={IndianRupee} label="Collected" value={stats ? inr(stats.total_revenue).replace('.00', '') : '—'} tone="emerald" delay="180ms" />
      </div>

      {loading ? (
        <Card className="animate-fade-up">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-teal-500/25 flex items-center justify-center">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Pickup requests</h3>
                <p className="text-sm text-slate-500">{filtered.length} of {items.length} requests</p>
              </div>
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No pickup requests yet"
              message="Doorstep scrap requests from the customer app appear here."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {filtered.length} of {items.length} shown
                  </p>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-52">
                      <option value="all">All statuses</option>
                      <option value="REQUEST_PLACED">Request placed</option>
                      <option value="BUYER_ASSIGNED">Buyer assigned</option>
                      <option value="OUT_FOR_PICKUP">Out for pickup</option>
                      <option value="WEIGHING_COMPLETED">Weighing completed</option>
                      <option value="PAYMENT_COMPLETED">Payment completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </Select>
                    <SearchInput value={q} onChange={setQ} placeholder="Code / customer / address…" className="w-full sm:w-56" />
                  </div>
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No requests match your filters</p>
                  <button type="button" onClick={() => { setQ(''); setStatusFilter('all'); }} className="mt-1 text-xs font-bold text-sky-600 hover:underline">
                    Clear filters
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Scrap request ${detail?.request_code || ''}`}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-400 font-bold uppercase">Customer</p><p className="font-semibold">{detail.customer_name || '—'}</p><p className="text-xs text-slate-500">{detail.customer_email || ''}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Contact</p><p className="font-semibold">{detail.contact_phone}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Status</p><Badge tone={STATUS_TONE[detail.status] || 'slate'} dot className="font-bold">{detail.status}</Badge></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Requested</p><p className="font-semibold">{fmtDate(detail.created_at)}</p></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-1.5">
              <p className="font-semibold text-slate-800">{(detail.materials || []).join(', ')}</p>
              <p className="text-xs text-slate-500">{detail.approx_weight_range} · {detail.pickup_type} pickup · {detail.preferred_date}, {detail.preferred_time_slot}</p>
              <p className="text-xs text-slate-500">{detail.pickup_address}</p>
              {detail.latitude != null && detail.longitude != null && (
                <p className="text-xs text-slate-500">GPS: {detail.latitude}, {detail.longitude}</p>
              )}
              {detail.special_instructions && <p className="text-xs text-slate-500">Note: {detail.special_instructions}</p>}
            </div>
            {detail.assigned_buyer_id && (
              <div className="rounded-xl bg-emerald-50 p-3 space-y-1">
                <p className="text-xs font-bold uppercase text-emerald-600">Assigned buyer</p>
                <p className="font-semibold text-slate-800 flex items-center gap-1.5"><Truck className="w-4 h-4 text-emerald-600" /> {detail.buyer_name} · {detail.buyer_vehicle_no || '—'}</p>
                <p className="text-xs text-slate-500">{detail.buyer_phone} · {detail.buyer_scale_type || '—'}</p>
              </div>
            )}
            {(detail.actual_weight_kg || detail.final_amount) && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Actual weight</span><span className="font-semibold">{detail.actual_weight_kg} kg</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Final amount</span><span className="font-semibold">{inr(detail.final_amount)}</span></div>
                {detail.payment_mode && <div className="flex justify-between"><span className="text-slate-500">Payment mode</span><span className="font-semibold">{detail.payment_mode}</span></div>}
              </div>
            )}
            {detail.status === 'CANCELLED' && (
              <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                Cancelled{detail.cancellation_reason ? `: ${detail.cancellation_reason}` : ''}
              </div>
            )}
            {photoHref && (
              <a href={photoHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> View scrap photo
              </a>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
        </div>
      </Modal>

      <Modal open={!!assignRow} onClose={() => setAssignRow(null)} title="Assign buyer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-mono font-bold text-sky-700">{assignRow?.request_code}</span> — {(assignRow?.materials || []).join(', ')}
          </p>
          <Select label="Buyer" value={assignBuyer} onChange={(e) => setAssignBuyer(e.target.value)}>
            <option value="">Select buyer…</option>
            {buyers.filter((b) => b.status === 'active').map((b) => (
              <option key={b.id} value={b.id}>{b.name} · {b.vehicle_no || b.phone}</option>
            ))}
          </Select>
          {buyers.filter((b) => b.status === 'active').length === 0 && (
            <p className="text-xs font-semibold text-rose-600">No active buyers — add one in Scrap Buyers.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setAssignRow(null)}>Cancel</Button>
          <Button onClick={applyAssign} loading={saving} disabled={!assignBuyer}>Assign</Button>
        </div>
      </Modal>

      <Modal open={!!statusRow} onClose={() => setStatusRow(null)} title="Advance request status" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-mono font-bold text-sky-700">{statusRow?.request_code}</span> — currently <Badge tone={STATUS_TONE[statusRow?.status] || 'slate'} dot className="font-bold ml-1">{statusRow?.status}</Badge>
          </p>
          <Select label="Next status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {(NEXT_OPTIONS[statusRow?.status] || []).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </Select>
          {form.status === 'WEIGHING_COMPLETED' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Actual weight (kg)" type="number" step="0.1" min="0" value={form.actual_weight_kg} onChange={(e) => setForm((f) => ({ ...f, actual_weight_kg: e.target.value }))} />
              <Input label="Final amount (₹)" type="number" step="0.01" min="0" value={form.final_amount} onChange={(e) => setForm((f) => ({ ...f, final_amount: e.target.value }))} />
            </div>
          )}
          {form.status === 'PAYMENT_COMPLETED' && (
            <Select label="Payment mode" value={form.payment_mode} onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Wallet">Wallet</option>
            </Select>
          )}
          {form.status === 'CANCELLED' && (
            <Textarea label="Cancellation reason (optional)" rows={2} value={form.cancellation_reason} onChange={(e) => setForm((f) => ({ ...f, cancellation_reason: e.target.value }))} />
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setStatusRow(null)}>Cancel</Button>
          <Button onClick={applyStatus} loading={saving} disabled={!form.status}>Update status</Button>
        </div>
      </Modal>
    </>
  );
}
