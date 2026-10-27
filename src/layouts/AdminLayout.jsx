import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, ClipboardList, FileText, Wrench, Siren,
  Home, Palette, BellRing, BarChart3, ShieldCheck, UserCog, LifeBuoy, ScrollText,
  Settings, Menu, X, LogOut, ChevronDown, Briefcase, CalendarCheck, Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Button } from '../components/ui';
import { cx } from '../lib/utils';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 animate-pulse shadow-lg shadow-brand-500/30" />
          <p className="text-sm font-semibold text-slate-500">Loading V_COM…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-[272px] z-40">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[290px] animate-slide-in">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-[272px] min-h-screen flex flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main key={location.pathname} className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-xs text-slate-400 border-t border-slate-200/70">
          © {new Date().getFullYear()} V_COM Business Management Platform
        </footer>
      </div>
    </div>
  );
}
