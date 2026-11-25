import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, ClipboardList, Siren, FileText, Wrench, Home, TrendingUp,
  ArrowUpRight, Activity, Clock, BarChart3, CalendarDays, ChevronRight,
  Banknote, Palette, UserCog, ShieldCheck, BellRing, Settings, Search,
  CheckCircle2, MapPin, ClipboardCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { dashboardApi, requestsApi } from '../../api/endpoints';
import {
  StatCard, Card, CardHeader, CardBody, PageLoader, StatusBadge, EmptyState,
  Button, Input, Textarea, Select, useToast,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { getError } from '../../api/client';
import { fmtMoney, fmtNum, timeAgo, labelize, cx } from '../../lib/utils';

const QUICK_ACTIONS = [
  { to: '/requests', label: 'Requests', icon: ClipboardList, perm: 'requests.view', cls: 'bg-white/10 ring-white/15 hover:bg-white/20' },
  { to: '/sos', label: 'SOS Board', icon: Siren, perm: 'sos.view', cls: 'bg-rose-500/20 ring-rose-400/30 hover:bg-rose-500/30' },
  { to: '/vendors', label: 'New Vendor', icon: Building2, perm: 'vendors.view', cls: 'bg-violet-500/20 ring-violet-400/30 hover:bg-violet-500/30' },
  { to: '/events', label: 'New Event', icon: CalendarDays, perm: 'events.view', cls: 'bg-sky-500/20 ring-sky-400/30 hover:bg-sky-500/30' },
  { to: '/requests', label: 'Update Ticket', icon: ClipboardCheck, perm: 'requests.manage', cls: 'bg-cyan-500/15 ring-cyan-400/25 hover:bg-cyan-500/25' },
  { to: '/services', label: 'Services', icon: Palette, perm: 'services.view', cls: 'bg-fuchsia-500/15 ring-fuchsia-400/25 hover:bg-fuchsia-500/25' },
  { to: '/payouts', label: 'Payout', icon: Banknote, perm: 'payouts.view', cls: 'bg-emerald-500/15 ring-emerald-400/25 hover:bg-emerald-500/25' },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view', cls: 'bg-amber-500/15 ring-amber-400/25 hover:bg-amber-500/25' },
];

const SHORTCUTS = [
  { to: '/services', label: 'Services', icon: Palette, perm: 'services.view' },
  { to: '/staff', label: 'Staff', icon: UserCog, perm: 'staff.manage' },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.manage' },
  { to: '/notifications', label: 'Notifications', icon: BellRing, perm: 'notifications.manage' },
  { to: '/settings', label: 'Settings', icon: Settings, perm: 'settings.manage' },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view' },
];

const TICKET_STATUSES = [
  'pending_review', 'assigned', 'quoted', 'approved', 'scheduled',
  'in_progress', 'completed', 'closed', 'cancelled',
];

const MAIN_MODULE_CODES = ['special-service', 'quick-service', 'general-assistance'];

const actionTone = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('delete') || a.includes('reject') || a.includes('cancel')) return 'from-rose-500 to-pink-500 shadow-rose-500/30';
  if (a.includes('login') || a.includes('logout')) return 'from-emerald-500 to-teal-500 shadow-emerald-500/30';
  if (a.includes('update') || a.includes('edit') || a.includes('approve') || a.includes('assign')) return 'from-violet-500 to-fuchsia-500 shadow-violet-500/30';
  return 'from-brand-500 to-violet-600 shadow-brand-500/30';
};

const ViewAllLink = ({ onClick, label = 'View all' }) => (
  <button
    onClick={onClick}
    className="text-xs font-semibold text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 ring-1 ring-brand-200 hover:ring-brand-600 px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1"
  >
    {label} <ArrowUpRight className="w-3.5 h-3.5" />
  </button>
);

const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export default function Dashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(14);
  const [moduleTab, setModuleTab] = useState('special-service');

  // ticket status form
  const [ticketNo, setTicketNo] = useState('');
  const [found, setFound] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let alive = true;
    dashboardApi
      .get({ days: rangeDays })
      .then((res) => { if (alive) setData(res.data.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [rangeDays]);

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (!data) return <EmptyState title="Dashboard unavailable" />;

  const c = data.counts;
  const chartData = (data.request_chart || []).map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    requests: Number(r.count),
  }));

  const moduleDaily = data.module_daily || [];
  const tabMods = moduleDaily.filter((m) => MAIN_MODULE_CODES.includes(m.module_code));
  const activeMod = tabMods.find((m) => m.module_code === moduleTab) || tabMods[0] || null;
  const modChart = (activeMod?.days || []).map((d) => ({ date: shortDate(d.date), count: d.count }));
  const modTotal = activeMod?.total ?? 0;
  const modPeak = modChart.length ? Math.max(...modChart.map((d) => d.count)) : 0;

  const total14 = chartData.reduce((s, d) => s + d.requests, 0);
  const peak14 = chartData.length ? Math.max(...chartData.map((d) => d.requests)) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const quick = QUICK_ACTIONS.filter((q) => can(q.perm));
  const shortcuts = SHORTCUTS.filter((s) => can(s.perm));

  const stats = [];
  if (can('customers.view')) stats.push({ icon: Users, label: 'Customers', value: fmtNum(c.customers), tone: 'brand', to: '/customers' });
  if (can('vendors.view')) stats.push({ icon: Building2, label: 'Vendors', value: fmtNum(c.vendors), tone: 'violet', sub: `${c.pending_vendors} pending approval`, to: '/vendors' });
  if (can('requests.view')) stats.push({ icon: ClipboardList, label: 'Active Requests', value: fmtNum(c.active_requests), tone: 'cyan', sub: `${fmtNum(c.requests)} total`, to: '/requests' });
  if (can('sos.view')) stats.push({ icon: Siren, label: 'Active SOS', value: fmtNum(c.active_sos), tone: 'rose', sub: `${fmtNum(c.sos_total)} total tickets`, to: '/sos' });
  if (can('events.view')) stats.push({ icon: CalendarDays, label: 'Events', value: fmtNum(c.events_total), tone: 'cyan', sub: `${fmtNum(c.events_upcoming)} upcoming`, to: '/events' });
  if (can('payouts.view')) stats.push({ icon: Banknote, label: 'Pending Payouts', value: fmtMoney(c.payouts_pending_amount), tone: 'amber', sub: `${c.payouts_pending_count} entries`, to: '/payouts' });
  if (can('quotations.view')) stats.push({ icon: FileText, label: 'Quotations', value: fmtNum(c.quotations), tone: 'amber', sub: `${c.pending_quotations} pending`, to: '/quotations' });
  if (can('jobs.view')) stats.push({ icon: Wrench, label: 'Active Jobs', value: fmtNum(c.active_jobs), tone: 'emerald', sub: `${c.completed_jobs} completed`, to: '/jobs' });
  if (can('properties.view')) stats.push({ icon: Home, label: 'Properties', value: fmtNum(c.properties), tone: 'violet', sub: `${c.new_property_enquiries} new enquiries`, to: '/properties' });
  stats.push({ icon: TrendingUp, label: 'Accepted Value', value: fmtMoney(c.revenue), tone: 'emerald', sub: 'From accepted quotations' });

  const findTicket = async () => {
    const t = ticketNo.trim();
    if (!t) return toast.error('Enter a ticket number');
    setSearching(true);
    setFound(null);
    try {
      const r = await requestsApi.list({ search: t, limit: 10 });
      const items = r.data.data?.items || [];
      const hit = items.find((x) => String(x.ticket_no).toLowerCase() === t.toLowerCase())
        || (items.length === 1 ? items[0] : null);
      if (!hit) toast.error('No request found for that ticket number');
      else {
        setFound(hit);
        setNewStatus(hit.status);
      }
    } catch (e) { toast.error(getError(e)); } finally { setSearching(false); }
  };

  const updateStatus = async () => {
    if (!found || !newStatus) return;
    setUpdating(true);
    try {
      await requestsApi.setStatus(found.id, { status: newStatus, note: note.trim() || undefined });
      toast.success(`Status updated → ${labelize(newStatus)}`);
      setFound({ ...found, status: newStatus });
      setNote('');
    } catch (e) { toast.error(getError(e)); } finally { setUpdating(false); }
  };

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
                key={`${q.to}-${q.label}`}
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

        {/* ---- Module Requests: per-day counts per module (tabs + range) ---- */}
        <Card className="animate-fade-up" style={{ animationDelay: '740ms' }}>
          <CardHeader
            icon={BarChart3}
            title="Module Requests"
            subtitle="Per-day count by module"
            actions={
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRangeDays(d)}
                    className={cx(
                      'px-2 py-1 rounded-md text-[11px] font-bold transition-all',
                      rangeDays === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            }
          />
          <CardBody className="h-[280px] pt-4 flex flex-col">
            {tabMods.length === 0 ? (
              <EmptyState title="No modules" message="Module data unavailable." />
            ) : (
              <>
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 mb-3">
                  {tabMods.map((m) => (
                    <button
                      key={m.module_code}
                      type="button"
                      onClick={() => setModuleTab(m.module_code)}
                      className={cx(
                        'flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all truncate',
                        activeMod?.module_code === m.module_code
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                      title={m.module_name}
                    >
                      {m.module_name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <span className="text-xs font-semibold text-slate-500">
                    {fmtNum(modTotal)} in last {rangeDays} days
                  </span>
                  <span className="text-[11px] font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-md">
                    peak {modPeak}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modChart} margin={{ left: -22, right: 6, top: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 13 }}
                        cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                        formatter={(v) => [v, 'Requests']}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ============ Management panels ============ */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {can('vendors.view') && (
          <Card className="animate-fade-up" style={{ animationDelay: '760ms' }}>
            <CardHeader
              icon={Building2}
              title="Vendor Management"
              actions={<ViewAllLink onClick={() => navigate('/vendors')} />}
            />
            <CardBody className="pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-violet-50 ring-1 ring-violet-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-violet-500">Total</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(c.vendors)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Active</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(c.vendors_active)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Inactive</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(Math.max(0, c.vendors - c.vendors_active))}</p>
                </div>
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Pending</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(c.pending_vendors)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {can('events.view') && (
          <Card className="animate-fade-up" style={{ animationDelay: '820ms' }}>
            <CardHeader
              icon={CalendarDays}
              title="Event Management"
              actions={<ViewAllLink onClick={() => navigate('/events')} />}
            />
            <CardBody className="pt-2">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl bg-sky-50 ring-1 ring-sky-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sky-600">Total</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(c.events_total)}</p>
                </div>
                <div className="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">Upcoming</p>
                  <p className="font-display text-xl font-extrabold text-slate-900">{fmtNum(c.events_upcoming)}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" icon={CalendarDays} className="w-full" onClick={() => navigate('/events')}>
                Add / manage events
              </Button>
            </CardBody>
          </Card>
        )}

        {can('payouts.view') && (
          <Card className="animate-fade-up" style={{ animationDelay: '880ms' }}>
            <CardHeader
              icon={Banknote}
              title="Payout Management"
              actions={<ViewAllLink onClick={() => navigate('/payouts')} />}
            />
            <CardBody className="pt-2">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-amber-50 ring-1 ring-amber-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Pending</p>
                  <p className="font-display text-sm font-extrabold text-slate-900">{fmtMoney(c.payouts_pending_amount)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Processed</p>
                  <p className="font-display text-sm font-extrabold text-slate-900">{fmtMoney(c.payouts_processed_amount)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</p>
                  <p className="font-display text-sm font-extrabold text-slate-900">
                    {fmtMoney((Number(c.payouts_pending_amount) || 0) + (Number(c.payouts_processed_amount) || 0))}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="secondary" icon={Banknote} className="w-full" onClick={() => navigate('/payouts')}>
                Generate payout report
              </Button>
            </CardBody>
          </Card>
        )}
      </div>

      {/* ============ Lists ============ */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="animate-fade-up" style={{ animationDelay: '800ms' }}>
          <CardHeader
            icon={ClipboardList}
            title="Recent Tickets"
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
                    {(r.vendor_name || r.location) && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        {r.vendor_name && <span className="font-semibold">{r.vendor_name}</span>}
                        {r.vendor_name && r.location && <span>·</span>}
                        {r.location && (
                          <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {r.location}</span>
                        )}
                      </p>
                    )}
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

      {/* ============ Ticket status + shortcuts ============ */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {can('requests.manage') && (
          <Card className="animate-fade-up" style={{ animationDelay: '920ms' }}>
            <CardHeader
              icon={ClipboardCheck}
              title="Ticket Status Update"
              subtitle="Find a ticket by number and change its status"
            />
            <CardBody className="pt-2">
              <div className="flex gap-2">
                <Input
                  value={ticketNo}
                  onChange={(e) => setTicketNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && findTicket()}
                  placeholder="e.g. VCM-2611-0001"
                  icon={Search}
                  className="flex-1"
                />
                <Button variant="secondary" loading={searching} onClick={findTicket} icon={Search}>
                  Find
                </Button>
              </div>
              {found && (
                <div className="mt-4 rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{found.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono font-semibold">{found.ticket_no}</span>
                        {found.customer_name ? ` · ${found.customer_name}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={found.status} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="New status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>{labelize(s)}</option>
                      ))}
                    </Select>
                    <Input
                      label="Remark (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Reason / note"
                    />
                  </div>
                  <Button
                    loading={updating}
                    onClick={updateStatus}
                    icon={CheckCircle2}
                    disabled={newStatus === found.status}
                    className="w-full"
                  >
                    {newStatus === found.status ? 'No change selected' : 'Update Status'}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <Card className="animate-fade-up" style={{ animationDelay: '960ms' }}>
          <CardHeader
            icon={Settings}
            title="System Controls"
            subtitle="Quick links to admin sections"
          />
          <CardBody className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {shortcuts.map((s) => (
                <button
                  key={s.to}
                  type="button"
                  onClick={() => navigate(s.to)}
                  className="group flex flex-col items-center gap-2 rounded-xl bg-slate-50 hover:bg-brand-50 ring-1 ring-slate-100 hover:ring-brand-200 px-3 py-4 transition-all duration-150"
                >
                  <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 ring-1 ring-brand-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <s.icon className="w-5 h-5 text-brand-600" />
                  </span>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-brand-700 text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
