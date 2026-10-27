import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, ClipboardList, FileText, Wrench, Siren,
  Building, Palette, BellRing, BarChart3, ShieldCheck, UserCog, LifeBuoy,
  ScrollText, Settings, X, Briefcase, CalendarCheck, Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cx } from '../../lib/utils';
import logo from '../../../assets/logo.jpeg';

const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view', end: true },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/customers', label: 'Customers', icon: Users, perm: 'customers.view' },
      { to: '/vendors', label: 'Vendors', icon: Building2, perm: 'vendors.view' },
      { to: '/staff', label: 'Staff Accounts', icon: UserCog, perm: 'staff.manage' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/requests', label: 'Requests', icon: ClipboardList, perm: 'requests.view' },
      { to: '/quotations', label: 'Quotations', icon: FileText, perm: 'quotations.view' },
      { to: '/jobs', label: 'Jobs & Orders', icon: Wrench, perm: 'jobs.view' },
      { to: '/sos', label: 'SOS Emergency', icon: Siren, perm: 'sos.view', accent: true },
    ],
  },
  {
    section: 'Properties',
    items: [
      { to: '/properties', label: 'Listings', icon: Building, perm: 'properties.view' },
      { to: '/properties/builders', label: 'Builders', icon: Briefcase, perm: 'properties.view' },
      { to: '/properties/projects', label: 'Projects', icon: Layers, perm: 'properties.view' },
      { to: '/properties/areas', label: 'Areas', icon: Palette, perm: 'properties.view' },
      { to: '/properties/enquiries', label: 'Enquiries', icon: BellRing, perm: 'properties.enquiries' },
    ],
  },
  {
    section: 'HR & Content',
    items: [
      { to: '/hr', label: 'Employees', icon: Users, perm: 'hr.view' },
      { to: '/hr/attendance', label: 'Attendance', icon: CalendarCheck, perm: 'hr.view' },
      { to: '/hr/leaves', label: 'Leaves', icon: ClipboardList, perm: 'hr.view' },
      { to: '/services', label: 'Services & Content', icon: Palette, perm: 'services.view' },
      { to: '/notifications', label: 'Notifications', icon: BellRing, perm: 'notifications.manage' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view' },
      { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.manage' },
      { to: '/support', label: 'Support Tickets', icon: LifeBuoy, perm: 'support.manage' },
      { to: '/audit', label: 'Audit Log', icon: ScrollText, perm: 'audit.view' },
      { to: '/settings', label: 'Settings', icon: Settings, perm: 'settings.manage' },
    ],
  },
];

function NavItem({ item, onClose }) {
  const { can } = useAuth();
  if (item.perm && !can(item.perm)) return null;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70',
          isActive
            ? 'bg-gradient-to-r from-brand-600/90 via-brand-600/70 to-violet-600/85 text-white shadow-lg shadow-brand-950/50 ring-1 ring-white/10'
            : 'text-slate-300/90 hover:bg-white/[0.07] hover:text-white hover:translate-x-0.5'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          )}
          <item.icon
            className={cx(
              'w-[18px] h-[18px] shrink-0 transition-all duration-150',
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-300 group-hover:scale-105'
            )}
          />
          <span className="truncate">{item.label}</span>
          {item.accent && !isActive && (
            <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onClose }) {
  const { can } = useAuth();
  return (
    <div className="relative h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* ambient orbs */}
      <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-brand-600/25 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 grid-overlay opacity-[0.04] pointer-events-none" />

      {/* Brand */}
      <div className="relative px-4 pt-5 pb-4 flex items-center justify-between border-b border-white/8">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logo}
            alt="V_COM"
            className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/15 shadow-lg shadow-emerald-500/10 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display font-extrabold text-[17px] leading-none tracking-tight">V_COM</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto dark-scroll px-3 py-4 space-y-5">
        {NAV.map((group, gi) => {
          const visible = group.items.filter((i) => !i.perm || can(i.perm));
          if (!visible.length) return null;
          return (
            <div
              key={group.section}
              className="animate-fade-up"
              style={{ animationDelay: `${gi * 50}ms` }}
            >
              <div className="flex items-center gap-2.5 px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{group.section}</p>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavItem key={item.to} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer brand card */}
      <div className="relative p-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] ring-1 ring-white/10 p-3.5">
          <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-brand-500/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />
          <div className="relative flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/25 flex items-center justify-center shrink-0 ring-1 ring-white/20">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight">Business Platform</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] text-slate-400">v1.0 · All systems online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
