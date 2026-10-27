import { useCallback, useEffect, useState } from 'react';
import {
  Users, Ban, CheckCircle2, Eye, RotateCcw, LayoutGrid, List,
  ClipboardList, CalendarDays, Clock, Mail, Phone, SearchX,
} from 'lucide-react';
import { customersApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, Modal, StatusBadge, TableSkeleton, EmptyState, Avatar, InfoRow,
  useToast, ConfirmDialog,
} from '../../components/ui';
import { fmtDate, timeAgo, fmtNum, labelize, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-slate-400' },
  { value: 'blocked', label: 'Blocked', dot: 'bg-rose-500' },
];

const miniTones = {
  brand: 'from-brand-500 to-violet-500 shadow-brand-500/25',
  violet: 'from-violet-500 to-fuchsia-500 shadow-violet-500/25',
  cyan: 'from-cyan-500 to-sky-500 shadow-cyan-500/25',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
  rose: 'from-rose-500 to-pink-500 shadow-rose-500/25',
};

function MiniStat({ icon: Icon, label, value, tone = 'brand' }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-sm p-3.5 flex items-center gap-3">
      <div className={cx('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md shrink-0', miniTones[tone])}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Customers() {
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
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({ page, limit: 15, search, status });
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
      const res = await customersApi.get(id);
      setDetail(res.data.data);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const changeStatus = async () => {
    try {
      await customersApi.setStatus(confirm.id, confirm.next);
      toast.success('Customer status updated');
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  const askToggle = (c) =>
    setConfirm({ id: c.id, name: c.name, next: c.status === 'active' ? 'blocked' : 'active' });

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/25 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">People</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customers</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{fmtNum(total)}</span> registered customers
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
            placeholder="Search name, email or phone…"
            className="flex-1 min-w-[220px]"
          />
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1); }}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  status === t.value
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                {t.label}
              </button>
            ))}
          </div>
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
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
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
            <TableSkeleton rows={8} cols={6} />
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
            title="No customers found"
            message="Try adjusting your search or filters."
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
                <TH>Customer</TH>
                <TH className="hidden md:table-cell">Phone</TH>
                <TH className="hidden lg:table-cell">Requests</TH>
                <TH>Status</TH>
                <TH className="hidden sm:table-cell">Joined</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <TRow key={c.id} onClick={() => openDetail(c.id)}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar name={c.name} size="sm" />
                        {c.status === 'active' && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {c.email}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell">
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                      </span>
                    ) : '—'}
                  </TD>
                  <TD className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                      <ClipboardList className="w-3 h-3 text-slate-400" /> {c.request_count} req
                    </span>
                  </TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="hidden sm:table-cell">
                    <p className="text-slate-600">{fmtDate(c.created_at)}</p>
                    <p className="text-xs text-slate-400">{timeAgo(c.created_at)}</p>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => openDetail(c.id)} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => askToggle(c)}
                        title={c.status === 'active' ? 'Block' : 'Activate'}
                        className={c.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                      >
                        {c.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
            {items.map((c, i) => (
              <Card
                key={c.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => openDetail(c.id)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={c.name} size="md" />
                    {c.status === 'active' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="relative font-semibold text-slate-900 mt-4 truncate">{c.name}</p>
                <p className="relative text-sm text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.email}
                </p>
                <p className="relative text-xs text-slate-400 truncate flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3 shrink-0" /> {c.phone || 'No phone'}
                </p>
                <div className="relative grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requests</p>
                    <p className="text-sm font-bold text-slate-800">{c.request_count}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined</p>
                    <p className="text-sm font-bold text-slate-800">{fmtDate(c.created_at, 'DD MMM YY')}</p>
                  </div>
                </div>
                <div className="relative flex gap-2 mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="secondary" icon={Eye} onClick={() => openDetail(c.id)} className="flex-1">
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant={c.status === 'active' ? 'danger' : 'success'}
                    icon={c.status === 'active' ? Ban : CheckCircle2}
                    onClick={() => askToggle(c)}
                  >
                    {c.status === 'active' ? 'Block' : 'Activate'}
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
        title={detail?.name}
        subtitle={detail ? `${detail.email} · ${detail.requests?.length || 0} requests` : ''}
        size="lg"
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat icon={ClipboardList} label="Requests" value={detail.requests?.length ?? 0} tone="brand" />
              <MiniStat icon={CalendarDays} label="Joined" value={fmtDate(detail.created_at, 'DD MMM YY')} tone="violet" />
              <MiniStat icon={Clock} label="Last login" value={detail.last_login_at ? timeAgo(detail.last_login_at) : 'Never'} tone="cyan" />
              <MiniStat
                icon={Users}
                label="Status"
                value={labelize(detail.status)}
                tone={detail.status === 'active' ? 'emerald' : detail.status === 'blocked' ? 'rose' : 'cyan'}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 rounded-2xl bg-slate-50/80 ring-1 ring-slate-100 p-4">
              <InfoRow label="Phone" value={detail.phone} />
              <InfoRow label="Email" value={detail.email} />
              <InfoRow label="Joined on" value={fmtDate(detail.created_at)} />
              <InfoRow
                label="Account"
                value={
                  <span className={cx(
                    'inline-flex items-center gap-1.5 text-xs font-semibold',
                    detail.status === 'active' ? 'text-emerald-600' : detail.status === 'blocked' ? 'text-rose-600' : 'text-slate-500'
                  )}>
                    <span className={cx(
                      'h-1.5 w-1.5 rounded-full',
                      detail.status === 'active' ? 'bg-emerald-500' : detail.status === 'blocked' ? 'bg-rose-500' : 'bg-slate-400'
                    )} />
                    {labelize(detail.status)}
                  </span>
                }
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Recent requests</p>
              {detail.requests?.length ? (
                <div className="space-y-2">
                  {detail.requests.map((r) => (
                    <div
                      key={r.id}
                      className="group flex items-center justify-between gap-3 rounded-xl bg-slate-50 hover:bg-brand-50/60 ring-1 ring-transparent hover:ring-brand-200 px-4 py-3 transition-all duration-150"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500/10 to-violet-500/10 ring-1 ring-brand-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <ClipboardList className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                          <p className="text-xs text-slate-500">
                            <span className="font-mono font-semibold text-slate-600">{r.ticket_no}</span> · {r.module_name}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No requests submitted yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={changeStatus}
        title={confirm?.next === 'blocked' ? 'Block customer?' : 'Activate customer?'}
        message={
          confirm?.next === 'blocked'
            ? `${confirm?.name} will no longer be able to sign in or submit requests.`
            : `${confirm?.name} will be able to sign in again.`
        }
        confirmText={confirm?.next === 'blocked' ? 'Block' : 'Activate'}
        tone={confirm?.next === 'blocked' ? 'danger' : 'success'}
      />
    </>
  );
}
