import { useCallback, useEffect, useState } from 'react';
import {
  Star, RotateCcw, SearchX, Hotel, Eye, EyeOff, Ticket,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { hotelApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Badge, Select, StatCard,
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

const Stars = ({ n }) => (
  <span className="inline-flex gap-0.5" title={`${n}/5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(Number(n) || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
    ))}
  </span>
);

export default function HotelReviews() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      hotelApi.stats().catch(() => null),
      hotelApi.reviews({ page: 1, limit: 100 }).catch(() => null),
    ])
      .then(([s, r]) => {
        if (s) setStats(s.data.data);
        if (r) setItems(r.data.data?.items || []);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const toggleStatus = async (r) => {
    const next = r.status === 'published' ? 'hidden' : 'published';
    setSavingId(r.review_id);
    try {
      await hotelApi.setReviewStatus(r.review_id.replace('rev-', ''), next);
      toast.success(`Review ${next}`);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setSavingId(null);
    }
  };

  const filtered = items.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    const s = q.toLowerCase();
    return !q || (r.property_name || '').toLowerCase().includes(s)
      || (r.guest_name || '').toLowerCase().includes(s)
      || (r.review_text || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      name: 'Property / Guest',
      selector: (r) => r.property_name,
      sortable: true,
      minWidth: '200px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
            <Hotel className="w-3.5 h-3.5 text-sky-500 shrink-0" /> {r.property_name}
          </p>
          <p className="text-xs text-slate-500 truncate">{r.guest_name || 'Guest'}{r.stay_type ? ` · ${r.stay_type}` : ''}</p>
        </div>
      ),
    },
    {
      name: 'Ratings',
      minWidth: '240px',
      cell: (r) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Stars n={r.overall_rating} />
            <span className="font-bold text-slate-700">{Number(r.overall_rating).toFixed(1)}</span>
            {r.would_recommend ? <Badge tone="emerald">Recommends</Badge> : <Badge tone="rose">No</Badge>}
          </div>
          <p className="text-slate-400 truncate max-w-[320px]">
            Clean {r.cleanliness_rating} · Comfort {r.room_comfort_rating} · Staff {r.staff_behaviour_rating} · Food {r.food_quality_rating} · Amen {r.amenities_rating} · Value {r.value_for_money_rating}
          </p>
        </div>
      ),
    },
    {
      name: 'Review',
      selector: (r) => r.review_text,
      minWidth: '260px',
      cell: (r) => <p className="text-xs text-slate-600 line-clamp-2">{r.review_text || '—'}</p>,
    },
    {
      name: 'Date',
      selector: (r) => r.created_at,
      sortable: true,
      width: '120px',
      cell: (r) => <span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span>,
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '120px',
      cell: (r) => (r.status === 'published'
        ? <Badge tone="emerald" dot className="font-bold">Published</Badge>
        : <Badge tone="slate" dot className="font-bold">Hidden</Badge>),
    },
    {
      name: '',
      right: true,
      width: '110px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            title={r.status === 'published' ? 'Hide review' : 'Publish review'}
            loading={savingId === r.review_id}
            onClick={() => toggleStatus(r)}
          >
            {r.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
            <Star className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Verified stay reviews & moderation
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Hotel Reviews</h1>
            <p className="text-sm text-slate-500 mt-0.5">Publish or hide guest feedback</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Star} label="Reviews" value={stats?.total_reviews ?? '—'} tone="brand" delay="0ms" />
        <StatCard icon={Star} label="Avg rating" value={stats?.avg_rating ?? '—'} tone="amber" delay="60ms" />
        <StatCard icon={Hotel} label="Properties" value={stats?.total_properties ?? '—'} tone="cyan" delay="120ms" />
        <StatCard icon={Star} label="Revenue" value={stats ? `₹${Math.round(stats.total_revenue).toLocaleString('en-IN')}` : '—'} tone="emerald" delay="180ms" />
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg shadow-amber-500/25 flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">All reviews</h3>
                <p className="text-sm text-slate-500">{filtered.length} of {items.length} reviews</p>
              </div>
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No reviews yet"
              message="Verified guest reviews will appear here after completed stays."
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
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </Select>
                    <SearchInput value={q} onChange={setQ} placeholder="Search reviews…" className="w-full sm:w-56" />
                  </div>
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No reviews match your filters</p>
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
    </>
  );
}
