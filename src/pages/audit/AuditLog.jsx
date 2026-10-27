import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollText, RotateCcw, SearchX, LayoutGrid, List, Globe,
  Clock, Fingerprint, LogIn, LogOut, Pencil, Trash2, PlusCircle,
  Flag, Database,
} from 'lucide-react';
import { auditApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, EmptyState, useToast, Badge, TableSkeleton, Avatar,
} from '../../components/ui';
import { fmtDateTime, timeAgo, cx } from '../../lib/utils';

const ACTION_PREFIXES = [
  { v: '', label: 'All', dot: null },
  { v: 'auth', label: 'Auth', dot: 'bg-violet-500' },
  { v: 'request', label: 'Requests', dot: 'bg-brand-500' },
  { v: 'vendor', label: 'Vendors', dot: 'bg-cyan-500' },
  { v: 'quotation', label: 'Quotations', dot: 'bg-amber-500' },
  { v: 'job', label: 'Jobs', dot: 'bg-emerald-500' },
  { v: 'sos', label: 'SOS', dot: 'bg-rose-500' },
  { v: 'property', label: 'Properties', dot: 'bg-sky-500' },
  { v: 'customer', label: 'Customers', dot: 'bg-indigo-500' },
  { v: 'staff', label: 'Staff', dot: 'bg-teal-500' },
  { v: 'employee', label: 'Employees', dot: 'bg-orange-500' },
  { v: 'role', label: 'Roles', dot: 'bg-fuchsia-500' },
  { v: 'support', label: 'Support', dot: 'bg-pink-500' },
  { v: 'settings', label: 'Settings', dot: 'bg-slate-400' },
  { v: 'notification', label: 'Notifications', dot: 'bg-blue-500' },
];

const DOMAIN_DOT = {};
ACTION_PREFIXES.forEach((a) => { if (a.dot) DOMAIN_DOT[a.v] = a.dot; });

const DOMAIN_CHIP = {
  auth: 'bg-violet-50 text-violet-700 ring-violet-200',
  request: 'bg-brand-50 text-brand-700 ring-brand-200',
  vendor: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  quotation: 'bg-amber-50 text-amber-700 ring-amber-200',
  job: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  sos: 'bg-rose-50 text-rose-700 ring-rose-200',
  property: 'bg-sky-50 text-sky-700 ring-sky-200',
  builder: 'bg-sky-50 text-sky-700 ring-sky-200',
  project: 'bg-sky-50 text-sky-700 ring-sky-200',
  area: 'bg-sky-50 text-sky-700 ring-sky-200',
  customer: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  staff: 'bg-teal-50 text-teal-700 ring-teal-200',
  employee: 'bg-orange-50 text-orange-700 ring-orange-200',
  attendance: 'bg-orange-50 text-orange-700 ring-orange-200',
  leave: 'bg-orange-50 text-orange-700 ring-orange-200',
  role: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  support: 'bg-pink-50 text-pink-700 ring-pink-200',
  settings: 'bg-slate-100 text-slate-700 ring-slate-200',
  notification: 'bg-blue-50 text-blue-700 ring-blue-200',
  module: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  category: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
};

const verbIcon = (action = '') => {
  if (action.includes('delete')) return { icon: Trash2, cls: 'from-rose-400 to-red-500 shadow-rose-500/30' };
  if (action.includes('login')) return { icon: LogIn, cls: 'from-violet-400 to-purple-500 shadow-violet-500/30' };
  if (action.includes('logout')) return { icon: LogOut, cls: 'from-slate-400 to-slate-500 shadow-slate-500/30' };
  if (action.includes('status')) return { icon: Flag, cls: 'from-amber-400 to-orange-500 shadow-amber-500/30' };
  if (action.includes('create')) return { icon: PlusCircle, cls: 'from-emerald-400 to-teal-500 shadow-emerald-500/30' };
  if (action.includes('update')) return { icon: Pencil, cls: 'from-cyan-400 to-sky-500 shadow-cyan-500/30' };
  return { icon: Database, cls: 'from-brand-400 to-violet-500 shadow-brand-500/30' };
};

const verbTone = (action = '') => {
  if (action.includes('delete')) return 'rose';
  if (action.includes('login') || action.includes('logout')) return 'violet';
  if (action.includes('status')) return 'amber';
  if (action.includes('create')) return 'emerald';
  if (action.includes('update')) return 'cyan';
  return 'brand';
};

export default function AuditLog() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [view, setView] = useState('timeline');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.list({ page, limit: 20, search, action: action || undefined });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (e) { toast.error(getError(e)); } finally { setLoading(false); }
  }, [page, search, action]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const domain = (l) => (l.action || '').split('.')[0];
  const verb = (l) => (l.action || '').split('.')[1] || '';

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-indigo-600 shadow-lg shadow-slate-700/30 flex items-center justify-center shrink-0">
            <ScrollText className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-ping" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="w-3 h-3" /> Security
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Audit Log</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} recorded actions</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Action domain chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {ACTION_PREFIXES.map((t) => {
            const active = action === t.v;
            return (
              <button
                key={t.v || 'all'}
                onClick={() => { setAction(t.v); setPage(1); }}
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
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search entity, user or description…"
            className="flex-1 min-w-[220px]"
          />
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { v: 'timeline', icon: List, label: 'Timeline view' },
              { v: 'table', icon: LayoutGrid, label: 'Table view' },
            ].map((v) => (
              <button
                key={v.v}
                onClick={() => setView(v.v)}
                title={v.label}
                aria-label={v.label}
                className={cx(
                  'p-1.5 rounded-lg transition-all duration-150',
                  view === v.v ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || action) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setAction(''); setPage(1); }}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up"><TableSkeleton rows={8} cols={6} /></Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No audit entries"
            message="User actions will be recorded here."
            action={(search || action) && (
              <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setAction(''); setPage(1); }}>Clear filters</Button>
            )}
          />
        </Card>
      ) : view === 'timeline' ? (
        <Card className="animate-fade-up p-5">
          <div className="relative space-y-5 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-indigo-300 via-slate-200 to-transparent">
            {items.map((l, i) => {
              const v = verbIcon(l.action);
              const Ico = v.icon;
              const d = domain(l);
              return (
                <div
                  key={l.id}
                  className="relative pl-12 group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                >
                  {/* rail dot */}
                  <span className={cx(
                    'absolute left-0 top-1 w-10 h-10 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center ring-4 ring-white transition-transform duration-200 group-hover:scale-105',
                    v.cls
                  )}>
                    <Ico className="w-4.5 h-4.5 text-white" />
                  </span>

                  {/* card */}
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 px-4 py-3 group-hover:bg-white group-hover:ring-slate-200 group-hover:shadow-sm transition-all duration-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cx(
                        'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold ring-1 capitalize',
                        DOMAIN_CHIP[d] || 'bg-slate-100 text-slate-700 ring-slate-200'
                      )}>
                        <span className={cx('h-1.5 w-1.5 rounded-full', DOMAIN_DOT[d] || 'bg-slate-400')} />
                        {d}
                      </span>
                      <Badge tone={verbTone(l.action)} className="font-bold capitalize">
                        {verb(l.action).replace(/_/g, ' ') || 'event'}
                      </Badge>
                      <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1" title={fmtDateTime(l.created_at)}>
                        <Clock className="w-3 h-3" /> {timeAgo(l.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar name={l.actor_name || 'System'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{l.actor_name || 'System'}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {l.ip_address || '—'}
                        </p>
                      </div>
                      {l.entity && (
                        <span className="ml-auto hidden sm:inline-flex items-center gap-1 rounded-lg bg-white ring-1 ring-slate-200 px-2 py-1 font-mono text-[11px] font-bold text-slate-600">
                          <Database className="w-3 h-3 text-slate-400" />
                          {l.entity}{l.entity_id ? `#${l.entity_id}` : ''}
                        </span>
                      )}
                    </div>
                    {l.details && (
                      <p className="mt-2 text-xs text-slate-500 font-mono bg-white ring-1 ring-slate-100 rounded-lg px-2.5 py-1.5 truncate">
                        {JSON.stringify(l.details)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-1">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>User</TH>
                <TH>Action</TH>
                <TH>Entity</TH>
                <TH className="hidden lg:table-cell">Details</TH>
                <TH className="hidden md:table-cell">IP</TH>
                <TH>When</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((l, i) => {
                const v = verbIcon(l.action);
                const Ico = v.icon;
                const d = domain(l);
                return (
                  <TRow key={l.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={l.actor_name || 'System'} size="sm" />
                        <p className="font-semibold text-slate-900 text-sm">{l.actor_name || 'System'}</p>
                      </div>
                    </TD>
                    <TD>
                      <span className={cx(
                        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ring-1 capitalize',
                        DOMAIN_CHIP[d] || 'bg-slate-100 text-slate-700 ring-slate-200'
                      )}>
                        <Ico className="w-3 h-3" />
                        {(l.action || '').replace('.', ' ')}
                      </span>
                    </TD>
                    <TD className="text-xs font-mono text-slate-600">{l.entity || '—'}{l.entity_id ? `#${l.entity_id}` : ''}</TD>
                    <TD className="hidden lg:table-cell text-sm text-slate-600 max-w-[320px] truncate">{l.details ? JSON.stringify(l.details) : '—'}</TD>
                    <TD className="hidden md:table-cell text-xs text-slate-400 font-mono">{l.ip_address || '—'}</TD>
                    <TD className="text-xs text-slate-500 whitespace-nowrap" title={fmtDateTime(l.created_at)}>{timeAgo(l.created_at)}</TD>
                  </TRow>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      )}
    </>
  );
}
