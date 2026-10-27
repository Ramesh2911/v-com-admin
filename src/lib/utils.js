import dayjs from 'dayjs';

export const cx = (...args) => args.filter(Boolean).join(' ');

export const fmtDate = (d, fmt = 'DD MMM YYYY') => (d ? dayjs(d).format(fmt) : '—');
export const fmtDateTime = (d) => (d ? dayjs(d).format('DD MMM YYYY, hh:mm A') : '—');
export const fmtTime = (d) => (d ? dayjs(d).format('hh:mm A') : '—');
export const timeAgo = (d) => {
  if (!d) return '—';
  const diff = Date.now() - dayjs(d).valueOf();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

export const fmtMoney = (n, currency = 'INR') => {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
};

export const fmtNum = (n) => {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(n));
};

export const statusTone = {
  // request statuses
  pending_review: 'amber',
  assigned: 'blue',
  quoted: 'violet',
  approved: 'indigo',
  scheduled: 'cyan',
  in_progress: 'blue',
  completed: 'emerald',
  closed: 'slate',
  cancelled: 'rose',
  // vendor
  pending: 'amber',
  rejected: 'rose',
  suspended: 'orange',
  // sos
  open: 'rose',
  acknowledged: 'amber',
  dispatched: 'violet',
  resolved: 'emerald',
  // quotation
  clarification_requested: 'amber',
  accepted: 'emerald',
  withdrawn: 'slate',
  // job stages
  awaiting_approval: 'amber',
  // general
  active: 'emerald',
  inactive: 'slate',
  blocked: 'rose',
  new: 'blue',
  contacted: 'cyan',
  follow_up: 'amber',
  // leaves
  // support
  // priority
  low: 'slate',
  normal: 'blue',
  high: 'orange',
  urgent: 'rose',
  critical: 'rose',
  // attendance
  present: 'emerald',
  absent: 'rose',
  half_day: 'amber',
  leave: 'violet',
  holiday: 'cyan',
  // properties
  available: 'emerald',
  sold: 'rose',
  rented: 'violet',
  draft: 'slate',
};

export const toneClasses = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200',
};

export const labelize = (s) =>
  String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const FILE_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
export const mediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:/.test(path) || path.startsWith('data:')) return path;
  return `${FILE_BASE}/uploads/${path.replace(/^\/+/, '')}`;
};
