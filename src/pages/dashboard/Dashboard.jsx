import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, ClipboardList, Siren, FileText, Wrench, Home, TrendingUp,
  ArrowUpRight, Activity, Clock, BarChart3, CalendarDays, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { dashboardApi } from '../../api/endpoints';
import {
  StatCard, Card, CardHeader, CardBody, PageLoader, StatusBadge, EmptyState,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtNum, timeAgo, labelize, cx } from '../../lib/utils';

const QUICK_ACTIONS = [
  { to: '/requests', label: 'Requests', icon: ClipboardList, perm: 'requests.view', cls: 'bg-white/10 ring-white/15 hover:bg-white/20' },
  { to: '/sos', label: 'SOS Board', icon: Siren, perm: 'sos.view', cls: 'bg-rose-500/20 ring-rose-400/30 hover:bg-rose-500/30' },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view', cls: 'bg-emerald-500/15 ring-emerald-400/25 hover:bg-emerald-500/25' },
];

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('reject') || a.includes('cancel')) return 'from-rose-500 to-pink-500 shadow-rose-500/30';
  if (a.includes('login') || a.includes('logout')) return 'from-emerald-500 to-teal-500 shadow-emerald-500/30';
  if (a.includes('update') || a.includes('edit') || a.includes('approve') || a.includes('assign')) return 'from-violet-500 to-fuchsia-500 shadow-violet-500/30';
  return 'from-brand-500 to-violet-600 shadow-brand-500/30';
};

const ViewAllLink = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-xs font-semibold text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 ring-1 ring-brand-200 hover:ring-brand-600 px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1"
  >
    View all <ArrowUpRight className="w-3.5 h-3.5" />
  </button>
);

export default function Dashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (!data) return <EmptyState title="Dashboard unavailable" />;

  const c = data.counts;
  const chartData = (data.request_chart || []).map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    requests: Number(r.count),
  }));
  const moduleData = (data.by_module || []).map((m) => ({
    name: m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name,
    count: Number(m.count),
  }));

  const total14 = chartData.reduce((s, d) => s + d.requests, 0);
  const peak14 = chartData.length ? Math.max(...chartData.map((d) => d.requests)) : 0;
  const topModule = moduleData[0]?.name || '—';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const quick = QUICK_ACTIONS.filter((q) => can(q.perm));

  const stats = [];
  if (can('customers.view')) stats.push({ icon: Users, label: 'Customers', value: fmtNum(c.customers), tone: 'brand', to: '/customers' });
  if (can('vendors.view')) stats.push({ icon: Building2, label: 'Vendors', value: fmtNum(c.vendors), tone: 'violet', sub: `${c.pending_vendors} pending approval`, to: '/vendors' });
  if (can('requests.view')) stats.push({ icon: ClipboardList, label: 'Active Requests', value: fmtNum(c.active_requests), tone: 'cyan', sub: `${fmtNum(c.requests)} total`, to: '/requests' });
  if (can('sos.view')) stats.push({ icon: Siren, label: 'Active SOS', value: fmtNum(c.active_sos), tone: 'rose', sub: `${fmtNum(c.sos_total)} total tickets`, to: '/sos' });
  if (can('quotations.view')) stats.push({ icon: FileText, label: 'Quotations', value: fmtNum(c.quotations), tone: 'amber', sub: `${c.pending_quotations} pending`, to: '/quotations' });
  if (can('jobs.view')) stats.push({ icon: Wrench, label: 'Active Jobs', value: fmtNum(c.active_jobs), tone: 'emerald', sub: `${c.completed_jobs} completed`, to: '/jobs' });
  if (can('properties.view')) stats.push({ icon: Home, label: 'Properties', value: fmtNum(c.properties), tone: 'violet', sub: `${c.new_property_enquiries} new enquiries`, to: '/properties' });
  stats.push({ icon: TrendingUp, label: 'Accepted Value', value: fmtMoney(c.revenue), tone: 'emerald', sub: 'From accepted quotations' });

  return (
    <>
      {/* ============ Hero banner ============ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-brand-950 to-black p-6 sm:p-8 text-white animate-fade-up mb-6">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-brand-500/30 blur-3xl animate-drift" />
        <div className="absolute -bottom-24 left-10 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl animate-drift-slow" />
        <div className="absolute inset-0 grid-overlay opacity-[0.06] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,transparent_30%,rgba(2,6,23,0.55)_100%)] pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold text-brand-200">
              <CalendarDays className="w-3.5 h-3.5" /> {today}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-brand-100/80 mt-1">Here's what's happening across your platform today.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {quick.map((q) => (
              <button
                key={q.to}
                onClick={() => navigate(q.to)}
                className={cx(
                  'inline-flex items-center gap-2 h-10 px-4 rounded-xl ring-1 backdrop-blur-sm text-sm font-semibold text-white shadow-lg shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150',
                  q.cls
                )}
              >
                <q.icon className="w-4 h-4" /> {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            {...s}
            delay={`${140 + i * 60}ms`}
            onClick={s.to ? () => navigate(s.to) : undefined}
          />
        ))}
      </div>

      {/* ============ Charts ============ */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '680ms' }}>
          <CardHeader
            icon={Activity}
            title="Request Volume"
            subtitle="Last 14 days"
            actions={
              <span className="text-xs font-semibold text-slate-600 bg-slate-100/80 ring-1 ring-slate-200 px-2.5 py-1 rounded-lg">
                {fmtNum(total14)} total · peak {peak14}
              </span>
            }
          />
          <CardBody className="h-[280px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', fontSize: 13 }}
                  formatter={(v) => [v, 'Requests']}
                />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '740ms' }}>
          <CardHeader
            icon={TrendingUp}
            title="By Module"
            subtitle="Requests per service area"
            actions={
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-2.5 py-1 rounded-lg">
                Top: {topModule}
              </span>
            }
          />
          <CardBody className="h-[280px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} layout="vertical" margin={{ left: 4, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 13 }}
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>
                  {moduleData.map((_, i) => (
                    <Cell key={i} fill={['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* ============ Lists ============ */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="animate-fade-up" style={{ animationDelay: '800ms' }}>
          <CardHeader
            icon={ClipboardList}
            title="Recent Requests"
            actions={can('requests.view') && <ViewAllLink onClick={() => navigate('/requests')} />}
          />
          {(data.recent_requests || []).length === 0 ? (
            <EmptyState title="No requests yet" message="Submitted enquiries will appear here." />
          ) : (
            <div>
              {data.recent_requests.map((r, i) => (
                <div
                  key={i}
                  onClick={() => can('requests.view') && navigate('/requests')}
                  className="group flex items-center gap-3.5 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-gradient-to-r hover:from-brand-50/60 hover:to-violet-50/40 cursor-pointer transition-all duration-150"
                >
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 ring-1 ring-brand-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-150">
                    <ClipboardList className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      <span className="font-mono font-semibold text-slate-600">{r.ticket_no}</span>
                      {' · '}{r.module_name} · {r.customer_name}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all duration-150" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: '860ms' }}>
          <CardHeader
            icon={Clock}
            title="Recent Activity"
            subtitle="Latest admin actions"
            actions={
              can('audit.view') && <ViewAllLink onClick={() => navigate('/audit')} />
            }
          />
          {(data.recent_activity || []).length === 0 ? (
            <EmptyState title="No activity yet" message="Admin actions will be logged here." />
          ) : (
            <div className="relative px-5 py-3">
              <div className="absolute left-[38px] top-8 bottom-8 w-px bg-gradient-to-b from-brand-300 via-slate-200 to-transparent -translate-x-1/2" />
              {data.recent_activity.map((a, i) => (
                <div key={i} className="relative flex items-start gap-3.5 py-3">
                  <div className={cx('h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 ring-2 ring-white shadow-md', actionTone(a.action))}>
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold text-slate-900">{labelize(a.action)}</span>
                      {a.entity && <span className="text-slate-500"> · {a.entity}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.actor_name} · {timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
