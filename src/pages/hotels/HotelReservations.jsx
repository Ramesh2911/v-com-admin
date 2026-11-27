import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck, RotateCcw, SearchX, Hotel, IndianRupee, Ticket, ExternalLink,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { hotelApi } from '../../api/endpoints';
import api, { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Badge, Select, StatCard,
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
  CONFIRMED: 'sky',
  COMPLETED: 'emerald',
  CANCELLED: 'rose',
  NO_SHOW: 'amber',
};

const MEAL = { EP: 'EP (Room Only)', CP: 'CP (Breakfast)', MAP: 'MAP (Breakfast+Dinner)', AP: 'AP (All Meals)' };

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HotelReservations() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState(null);
  const [statusRow, setStatusRow] = useState(null);
  const [newStatus, setNewStatus] = useState('COMPLETED');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      hotelApi.stats().catch(() => null),
      hotelApi.reservations({ page: 1, limit: 100 }).catch(() => null),
    ])
      .then(([s, r]) => {
        if (s) setStats(s.data.data);
        if (r) setItems(r.data.data?.items || []);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const changeStatus = async () => {
    setSaving(true);
    try {
      await hotelApi.setReservationStatus(statusRow.id, newStatus);
      toast.success(`Reservation marked ${newStatus}`);
      setStatusRow(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((r) => {
    if (statusFilter !== 'all' && r.booking_status !== statusFilter) return false;
    const s = q.toLowerCase();
    return !q || (r.reservation_code || '').toLowerCase().includes(s)
      || (r.guest_name || '').toLowerCase().includes(s)
      || (r.property_name || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      name: 'Reservation',
      selector: (r) => r.reservation_code,
      sortable: true,
      minWidth: '170px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-bold text-sky-700">{r.reservation_code}</p>
          <p className="text-xs text-slate-500 truncate">{r.guest_name}</p>
        </div>
      ),
    },
    {
      name: 'Property / Room',
      selector: (r) => r.property_name,
      sortable: true,
      minWidth: '200px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
            <Hotel className="w-3.5 h-3.5 text-sky-500 shrink-0" /> {r.property_name}
          </p>
          <p className="text-xs text-slate-500 truncate">{r.room_name} · {MEAL[r.meal_plan] || r.meal_plan}</p>
        </div>
      ),
    },
    {
      name: 'Stay',
      selector: (r) => r.check_in_date,
      sortable: true,
      width: '190px',
      cell: (r) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{fmtDate(r.check_in_date)} → {fmtDate(r.check_out_date)}</p>
          <p className="text-slate-500">{r.number_of_nights} night(s) · {r.number_of_rooms} room(s) · {r.adults}A {r.children > 0 ? `${r.children}C` : ''}</p>
        </div>
      ),
    },
    {
      name: 'Amount',
      selector: (r) => Number(r.total_amount) || 0,
      sortable: true,
      width: '130px',
      cell: (r) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{inr(r.total_amount)}</p>
          <p className="text-slate-500">{r.payment_method === 'online' ? 'Paid online' : 'Pay at hotel'}</p>
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (r) => r.booking_status,
      sortable: true,
      width: '130px',
      cell: (r) => <Badge tone={STATUS_TONE[r.booking_status] || 'slate'} dot className="font-bold">{r.booking_status}</Badge>,
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
          <Button size="icon" variant="ghost" title="View details" onClick={() => setDetail(r)}><ExternalLink className="w-4 h-4" /></Button>
          {r.booking_status === 'CONFIRMED' && (
            <Button size="icon" variant="ghost" title="Change status" onClick={() => { setStatusRow(r); setNewStatus('COMPLETED'); }}><CalendarCheck className="w-4 h-4" /></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Reservations, vouchers & check-in status
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Hotel Reservations</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track bookings, mark completed / no-show</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CalendarCheck} label="Reservations" value={stats?.total_reservations ?? '—'} tone="brand" delay="0ms" />
        <StatCard icon={IndianRupee} label="Revenue (CONF+COMPL)" value={stats ? inr(stats.total_revenue).replace('.00', '') : '—'} tone="emerald" delay="60ms" />
        <StatCard icon={CalendarCheck} label="Upcoming (CONFIRMED)" value={stats?.confirmed ?? '—'} tone="cyan" delay="120ms" />
        <StatCard icon={Hotel} label="Completed" value={stats?.completed ?? '—'} tone="amber" delay="180ms" />
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 shadow-lg shadow-sky-500/25 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">All reservations</h3>
                <p className="text-sm text-slate-500">{filtered.length} of {items.length} bookings</p>
              </div>
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No reservations yet"
              message="Bookings created from the customer app will appear here."
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
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44">
                      <option value="all">All statuses</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No show</option>
                    </Select>
                    <SearchInput value={q} onChange={setQ} placeholder="Code / guest / property…" className="w-full sm:w-56" />
                  </div>
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No reservations match your filters</p>
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

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Reservation ${detail?.reservation_code || ''}`}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-400 font-bold uppercase">Guest</p><p className="font-semibold">{detail.guest_name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Phone</p><p className="font-semibold">{detail.guest_phone || '—'}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="font-semibold truncate">{detail.guest_email || '—'}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase">Status</p><Badge tone={STATUS_TONE[detail.booking_status] || 'slate'} dot className="font-bold">{detail.booking_status}</Badge></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-1.5">
              <p className="font-semibold text-slate-800">{detail.property_name} — {detail.room_name}</p>
              <p className="text-xs text-slate-500">{fmtDate(detail.check_in_date)} → {fmtDate(detail.check_out_date)} · {detail.number_of_nights} night(s) · {MEAL[detail.meal_plan] || detail.meal_plan}</p>
              <p className="text-xs text-slate-500">{detail.adults} adults, {detail.children} children · {detail.number_of_rooms} room(s)</p>
              {detail.special_requests && <p className="text-xs text-slate-500">Requests: {detail.special_requests}</p>}
            </div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Room tariff</span><span className="font-semibold">{inr(detail.room_tariff)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Taxes & GST (18%)</span><span className="font-semibold">{inr(detail.taxes_gst)}</span></div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5"><span className="font-bold">Total</span><span className="font-bold">{inr(detail.total_amount)}</span></div>
            </div>
            {detail.voucher_pdf_path && (
              <a href={`${api.defaults.baseURL.replace(/\/api\/v1\/?$/, '')}/uploads/${detail.voucher_pdf_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline">
                <ExternalLink className="w-3.5 h-3.5" /> Download voucher PDF
              </a>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
        </div>
      </Modal>

      <Modal open={!!statusRow} onClose={() => setStatusRow(null)} title="Change reservation status" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-mono font-bold text-sky-700">{statusRow?.reservation_code}</span> — {statusRow?.guest_name}
          </p>
          <Select label="New status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="COMPLETED">Completed (stay finished)</option>
            <option value="NO_SHOW">No show (guest never arrived)</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setStatusRow(null)}>Cancel</Button>
          <Button onClick={changeStatus} loading={saving}>Update status</Button>
        </div>
      </Modal>
    </>
  );
}
