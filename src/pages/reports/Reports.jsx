import { useEffect, useState } from 'react';
import {
  BarChart3, Download, RefreshCw, Inbox, FileText, Wrench, Users, Store,
  Siren, Building2, CalendarRange, TrendingUp, BadgeCheck, Briefcase,
  ClipboardList, AreaChart as AreaChartIcon, Table2, Sparkles, FileDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { reportsApi } from '../../api/endpoints';
import api, { getError } from '../../api/client';
import {
  Card, CardBody, Button, PageLoader, EmptyState, useToast,
  Table, TH, TD, TRow, StatCard, Badge,
} from '../../components/ui';
import { fmtMoney, fmtNum, statusTone, cx, labelize } from '../../lib/utils';

const REPORT_TYPES = [
  { value: 'requests', label: 'Requests', icon: Inbox },
  { value: 'quotations', label: 'Quotations', icon: FileText },
  { value: 'jobs', label: 'Jobs', icon: Wrench },
  { value: 'customers', label: 'Customers', icon: Users },
  { value: 'vendors', label: 'Vendors', icon: Store },
  { value: 'sos', label: 'SOS', icon: Siren },
  { value: 'properties', label: 'Properties', icon: Building2 },
  { value: 'leaves', label: 'Leaves', icon: CalendarRange },
];

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#64748b', '#ec4899'];

const isMoneyKey = (k) => k.includes('amount') || k === 'total_amount' || k === 'value';
const isStatusKey = (k) => k === 'status' || k === 'stage' || k === 'priority' || k === 'leave_type' || k === 'listing_type';
const isMonoKey = (k) => k.includes('ticket') || k.endsWith('_no') || k.includes('code');

export default function Reports() {
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [type, setType] = useState('requests');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/admin/reports/${type}`, { params: { format: 'csv' }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vcom-${type}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (e) { toast.error(getError(e)); } finally { setExporting(false); }
  };

  const refresh = () => {
    setRefreshing(true);
    reportsApi.overview()
      .then((r) => setOverview(r.data.data))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    reportsApi.overview().then((r) => setOverview(r.data.data)).catch((e) => toast.error(getError(e))).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoadingReport(true);
    reportsApi.get(type).then((r) => setReport(r.data.data)).catch((e) => toast.error(getError(e))).finally(() => setLoadingReport(false));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader label="Loading analytics…" />;

  const monthly = (overview?.monthly || []).map((m) => ({
    month: new Date(m.month + '-02').toLocaleDateString('en-IN', { month: 'short' }),
    requests: Number(m.requests),
  }));

  const currentType = REPORT_TYPES.find((t) => t.value === type);

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Analytics
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reports &amp; Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">Operational insights with CSV export</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} loading={refreshing} onClick={refresh}>Refresh</Button>
          <Button icon={Download} loading={exporting} onClick={exportCsv} className="btn-shine relative overflow-hidden">
            Export {currentType?.label} CSV
          </Button>
        </div>
      </div>

      {overview && (
        <>
          {/* ============ Stats ============ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Inbox} label="Total Requests" value={fmtNum(overview.requests.total)} tone="brand" delay="0ms" sub={`${overview.requests.completed} completed`} />
            <StatCard icon={BadgeCheck} label="Accepted Quotations" value={fmtNum(overview.quotations.accepted)} tone="emerald" delay="60ms" sub={fmtMoney(overview.quotations.accepted_value)} />
            <StatCard icon={Briefcase} label="Approved Vendors" value={fmtNum(overview.vendors.approved)} tone="violet" delay="120ms" sub={`${overview.vendors.pending} pending`} />
            <StatCard icon={ClipboardList} label="Active Jobs" value={fmtNum(overview.jobs.active)} tone="cyan" delay="180ms" sub={`${overview.jobs.completed} completed`} />
          </div>

          {/* ============ Charts ============ */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-1">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0">
                  <AreaChartIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900">Monthly requests</h3>
                  <p className="text-sm text-slate-500">Last 12 months</p>
                </div>
                <Badge tone="violet" className="ml-auto font-bold">{monthly.length} mo</Badge>
              </div>
              <CardBody className="h-[260px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ left: -20, right: 8 }}>
                    <defs>
                      <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gRep)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: '140ms' }}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-1">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900">Module performance</h3>
                  <p className="text-sm text-slate-500">Requests per service module</p>
                </div>
                <Badge tone="cyan" className="ml-auto font-bold">{overview.module_performance.length} modules</Badge>
              </div>
              <CardBody className="h-[260px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.module_performance.map((m) => ({ ...m, requests: Number(m.requests), completed: Number(m.completed) }))} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="module" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 13 }} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                    <Bar dataKey="requests" radius={[6, 6, 0, 0]} barSize={18}>
                      {overview.module_performance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                    <Bar dataKey="completed" radius={[6, 6, 0, 0]} barSize={18} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* ============ Report type selector (eye-catch chips) ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {REPORT_TYPES.map((t) => {
            const active = type === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <t.icon className={cx('w-4 h-4', active ? 'text-violet-500' : 'text-slate-400')} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Detailed table ============ */}
      <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '60ms' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25 flex items-center justify-center">
              <Table2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                {currentType?.label} report
                {report?.rows && (
                  <Badge tone="violet" className="font-bold">{fmtNum(report.rows.length)} rows</Badge>
                )}
              </h3>
              <p className="text-sm text-slate-500">Select a report and export to CSV</p>
            </div>
          </div>
          <Button variant="secondary" icon={FileDown} loading={exporting} onClick={exportCsv}>Export CSV</Button>
        </div>

        {loadingReport ? (
          <PageLoader label="Loading report…" />
        ) : !report?.rows?.length ? (
          <EmptyState
            icon={Sparkles}
            title="No data"
            message="This report has no rows yet."
          />
        ) : (
          <Table>
            <thead>
              <tr>{report.columns.map((c) => <TH key={c.key}>{c.label}</TH>)}</tr>
            </thead>
            <tbody>
              {report.rows.slice(0, 100).map((r, i) => (
                <TRow key={i} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                  {report.columns.map((c) => (
                    <TD key={c.key}>
                      {isMoneyKey(c.key) ? (
                        <span className="font-bold text-emerald-600">{fmtMoney(r[c.key])}</span>
                      ) : isStatusKey(c.key) ? (
                        <Badge tone={statusTone[r[c.key]] || 'slate'} className="font-bold">
                          {labelize(r[c.key])}
                        </Badge>
                      ) : isMonoKey(c.key) ? (
                        <span className="font-mono text-xs font-bold text-violet-600">{String(r[c.key] ?? '—')}</span>
                      ) : (
                        String(r[c.key] ?? '—')
                      )}
                    </TD>
                  ))}
                </TRow>
              ))}
            </tbody>
          </Table>
        )}
        {report?.rows?.length > 100 && (
          <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
            Showing first 100 of {fmtNum(report.rows.length)} rows — export CSV for full data.
          </p>
        )}
      </Card>
    </>
  );
}
