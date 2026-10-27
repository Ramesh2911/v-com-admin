import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, RotateCcw, SearchX, MapPin, Star, CheckCircle2, CalendarDays,
  List, LayoutGrid,
} from 'lucide-react';
import { vendorsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, StatusBadge, TableSkeleton, EmptyState, Avatar, useToast, ConfirmDialog,
} from '../../components/ui';
import { fmtDate, timeAgo, fmtNum, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'approved', label: 'Approved', dot: 'bg-emerald-500' },
  { value: 'suspended', label: 'Suspended', dot: 'bg-slate-400' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-rose-500' },
];

export default function Vendors() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [approveFor, setApproveFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorsApi.list({ page, limit: 15, search, status });
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
    vendorsApi.stats().then((res) => {
      const map = {};
      res.data.data.forEach((r) => (map[r.status] = Number(r.count)));
      setCounts(map);
    }).catch(() => {});
  }, []);

  const approve = async () => {
    try {
      await vendorsApi.approve(approveFor.id);
      toast.success('Vendor approved');
      setApproveFor(null);
      load();
      vendorsApi.stats().then((res) => {
        const map = {};
        res.data.data.forEach((r) => (map[r.status] = Number(r.count)));
        setCounts(map);
      }).catch(() => {});
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">People</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Vendors</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{fmtNum(total)}</span> service partners
            </p>
          </div>
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search business name, contact or email…"
            className="flex-1 min-w-[220px]"
          />
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl flex-wrap">
            {STATUS_TABS.map((t) => {
              const active = status === t.value;
              const count = t.value ? counts[t.value] ?? 0 : total;
              return (
                <button
                  key={t.value}
                  onClick={() => { setStatus(t.value); setPage(1); }}
                  className={cx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150',
                    active
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                  {t.label}
                  <span className={cx(
                    'ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                    active ? 'bg-violet-50 text-violet-600' : 'bg-slate-200/80 text-slate-500'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl ml-auto">
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
                    ? 'bg-white text-violet-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={load}>Refresh</Button>
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
            title="No vendors found"
            message="Vendors appear here once they're created or apply."
            action={
              (search || status) && (
                <Button variant="secondary" icon={RotateCcw} onClick={clearFilters}>Clear filters</Button>
              )
            }
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Vendor</TH>
                <TH className="hidden md:table-cell">City</TH>
                <TH className="hidden lg:table-cell">Categories</TH>
                <TH className="hidden sm:table-cell">Rating</TH>
                <TH>Status</TH>
                <TH className="hidden lg:table-cell">Joined</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <TRow key={v.id} onClick={() => navigate(`/vendors/${v.id}`)}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar name={v.business_name} size="sm" />
                        {v.status === 'approved' && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{v.business_name}</p>
                        <p className="text-xs text-slate-500 truncate">{v.name} · {v.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell">
                    {v.city ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {v.city}
                      </span>
                    ) : '—'}
                  </TD>
                  <TD className="hidden lg:table-cell max-w-[220px]">
                    <p className="text-xs text-slate-600 truncate">{v.categories || '—'}</p>
                  </TD>
                  <TD className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-2 py-1 text-xs font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {Number(v.rating || 0).toFixed(1)}
                    </span>
                  </TD>
                  <TD><StatusBadge status={v.status} /></TD>
                  <TD className="hidden lg:table-cell">
                    <p className="text-slate-600">{fmtDate(v.created_at)}</p>
                    <p className="text-xs text-slate-400">{timeAgo(v.created_at)}</p>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {v.status === 'pending' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Approve"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => setApproveFor({ id: v.id, name: v.business_name })}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/vendors/${v.id}`)}>
                        Manage
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
            {items.map((v, i) => (
              <Card
                key={v.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate(`/vendors/${v.id}`)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={v.business_name} size="md" />
                    {v.status === 'approved' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <p className="relative font-semibold text-slate-900 mt-4 truncate">{v.business_name}</p>
                <p className="relative text-sm text-slate-500 truncate mt-0.5">{v.name} · {v.email}</p>
                <p className="relative text-xs text-slate-400 truncate flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {v.city || 'Location TBD'}
                </p>
                <p className="relative text-xs text-slate-500 truncate mt-2">{v.categories || 'No categories'}</p>
                <div className="relative grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-xl bg-amber-50 ring-1 ring-amber-100 px-3 py-2 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-700">{Number(v.rating || 0).toFixed(1)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Rating</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined</p>
                    <p className="text-sm font-bold text-slate-800">{fmtDate(v.created_at, 'DD MMM YY')}</p>
                  </div>
                </div>
                <div className="relative flex gap-2 mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  {v.status === 'pending' && (
                    <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => setApproveFor({ id: v.id, name: v.business_name })} className="flex-1">
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" icon={CalendarDays} onClick={() => navigate(`/vendors/${v.id}`)} className={v.status === 'pending' ? '' : 'flex-1'}>
                    Manage
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

      <ConfirmDialog
        open={!!approveFor}
        onClose={() => setApproveFor(null)}
        onConfirm={approve}
        title="Approve vendor?"
        message={`${approveFor?.name} will be able to receive assignments and submit quotations.`}
        confirmText="Approve"
        tone="success"
      />
    </>
  );
}
