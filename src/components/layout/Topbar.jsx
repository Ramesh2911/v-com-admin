import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, ChevronDown, Check, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { myNotificationsApi } from '../../api/endpoints';
import { Avatar, Badge } from '../ui';
import { timeAgo, cx } from '../../lib/utils';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifs = async () => {
    try {
      const res = await myNotificationsApi.list();
      setNotifs(res.data.data.items.slice(0, 12));
      setUnread(res.data.data.unread);
    } catch {
      /* not critical */
    }
  };

  const markAll = async () => {
    try {
      await myNotificationsApi.markRead();
      loadNotifs();
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200/70">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16 max-w-[1600px] mx-auto">
        <button onClick={onMenu} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600">
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 flex-1 min-w-0">
          <span className="font-semibold text-slate-900 truncate">
            {user?.role_name || 'Administrator'}
          </span>
          <span className="text-slate-300">·</span>
          <span className="truncate">{user?.email}</span>
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[340px] max-w-[92vw] bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-sm text-slate-900">Notifications</p>
                <button onClick={markAll} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifs.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No notifications</p>
                )}
                {notifs.map((n) => (
                  <div key={n.id} className={cx('px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50', !n.read_at && 'bg-brand-50/40')}>
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition"
          >
            <Avatar name={user?.name} src={user?.avatar} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user?.role_name}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <Badge tone="brand" className="mt-2">{user?.role_name}</Badge>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-400" /> My Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
