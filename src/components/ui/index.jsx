import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle2, AlertCircle, Info, AlertTriangle, Search, Inbox, Loader2,
  ChevronLeft, ChevronRight, UploadCloud, File as FileIcon, Trash2, ArrowUpRight,
} from 'lucide-react';
import { cx, statusTone, toneClasses, labelize } from '../../lib/utils';

/* ==================== TOASTS ==================== */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((type, message, title) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, type, message, title }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const toast = {
    success: (m, t) => push('success', m, t),
    error: (m, t) => push('error', m, t),
    info: (m, t) => push('info', m, t),
    warning: (m, t) => push('warning', m, t),
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed z-[100] top-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-slide-in rounded-2xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 p-4 flex gap-3 items-start"
          >
            <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
            <div className="min-w-0 flex-1">
              {t.title && <p className="text-sm font-semibold text-slate-900">{t.title}</p>}
              <p className="text-sm text-slate-600 break-words">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

/* ==================== BUTTON ==================== */
const btnVariants = {
  primary:
    'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-600/25 hover:from-brand-500 hover:to-violet-500 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98]',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:bg-rose-500 active:scale-[0.98]',
  success: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 active:scale-[0.98]',
  warning: 'bg-amber-500 text-white shadow-md shadow-amber-500/25 hover:bg-amber-400 active:scale-[0.98]',
  link: 'text-brand-600 hover:text-brand-700 hover:underline px-0',
};
const btnSizes = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
  sm: 'h-8.5 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        btnVariants[variant],
        btnSizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className={size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      {children}
    </button>
  );
}

/* ==================== CARD ==================== */
export function Card({ className, children, hover, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cx(
        'rounded-2xl bg-white ring-1 ring-slate-900/5 shadow-sm shadow-slate-900/[0.03]',
        hover && 'hover:shadow-lg hover:ring-slate-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        onClick && !hover && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, icon: Icon, className }) {
  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 ring-1 ring-brand-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand-600" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-slate-900 truncate">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cx('p-5', className)}>{children}</div>;
}

/* ==================== BADGE ==================== */
export function Badge({ tone = 'slate', children, dot, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 capitalize whitespace-nowrap',
        toneClasses[tone] || toneClasses.slate,
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  if (!status) return null;
  const tone = statusTone[status] || 'slate';
  return (
    <Badge tone={tone} dot className={className}>
      {labelize(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  const tone = statusTone[priority] || 'slate';
  const icon = priority === 'urgent' || priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'normal' ? '🔵' : '⚪';
  return (
    <Badge tone={tone}>
      <span className="text-[10px]">{icon}</span> {labelize(priority)}
    </Badge>
  );
}

/* ==================== FORM ==================== */
export function Label({ children, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

const fieldBase =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition disabled:bg-slate-50 disabled:text-slate-500';

export function Input({ label, error, hint, className, icon: Icon, suffix, ...props }) {
  return (
    <div className={className}>
      {label && <Label required={props.required}>{label}</Label>}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors peer-focus:text-brand-500" />
        )}
        <input
          className={cx('peer', fieldBase, Icon && 'pl-10', suffix && 'pr-11', error && 'ring-rose-300 focus:ring-rose-500')}
          {...props}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, rows = 4, ...props }) {
  return (
    <div className={className}>
      {label && <Label required={props.required}>{label}</Label>}
      <textarea rows={rows} className={cx(fieldBase, 'resize-y', error && 'ring-rose-300 focus:ring-rose-500')} {...props} />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, children, ...props }) {
  return (
    <div className={className}>
      {label && <Label required={props.required}>{label}</Label>}
      <select className={cx(fieldBase, 'appearance-none bg-no-repeat pr-9', error && 'ring-rose-300 focus:ring-rose-500')}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.6rem center',
          backgroundSize: '1.1em',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(fieldBase, 'pl-9')}
      />
    </div>
  );
}

/* ==================== MODAL ==================== */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', icon: Icon }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    // lock scroll without layout shift (compensate scrollbar width)
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  return createPortal(
    /* portal to body: immune to transformed ancestors that break position:fixed */
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-3 sm:p-4">
        <div
          className={cx('relative w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/20 animate-scale-in flex flex-col overflow-hidden my-auto', sizes[size])}
          style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 shrink-0" />
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              {Icon && (
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/25 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-slate-900">{title}</h3>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 h-9 w-9 rounded-xl hover:bg-slate-100 hover:rotate-90 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="px-5 sm:px-6 pb-5 overflow-y-auto overscroll-contain flex-1 min-h-0 modal-scroll">{children}</div>
          {footer && (
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white/95 backdrop-blur flex flex-wrap justify-end gap-2 shrink-0">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmText = 'Confirm', tone = 'danger', loading }) {
  const icons = { danger: AlertTriangle, success: CheckCircle2, warning: AlertTriangle, primary: Info };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" icon={icons[tone] || AlertTriangle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

/* ==================== TABLE ==================== */
export function Table({ children, className }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function TH({ children, className, align = 'left' }) {
  return (
    <th className={cx('px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 whitespace-nowrap', `text-${align}`, className)}>
      {children}
    </th>
  );
}

export function TD({ children, className, align = 'left', colSpan }) {
  return (
    <td colSpan={colSpan} className={cx('px-4 py-3.5 text-slate-700 align-middle', `text-${align}`, className)}>
      {children}
    </td>
  );
}

export function TRow({ children, onClick, className, style }) {
  return (
    <tr
      onClick={onClick}
      style={style}
      className={cx('border-b border-slate-100 last:border-0 transition-colors', onClick && 'cursor-pointer hover:bg-brand-50/40', className)}
    >
      {children}
    </tr>
  );
}

/* ==================== PAGINATION ==================== */
export function Pagination({ page, totalPages, onPage, total, limit }) {
  if (!totalPages || totalPages <= 1) return total ? (
    <div className="px-4 py-3 text-xs text-slate-500 text-right border-t border-slate-100">{total} records</div>
  ) : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalPages}</span> · {total} records
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={ChevronLeft}>
          Prev
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)} icon={ChevronRight} className="flex-row-reverse">
          Next
        </Button>
      </div>
    </div>
  );
}

/* ==================== STAT CARD ==================== */
const statTones = {
  brand: { grad: 'from-brand-500 to-violet-500 shadow-brand-500/25', wash: 'bg-brand-400/25' },
  emerald: { grad: 'from-emerald-500 to-teal-500 shadow-emerald-500/25', wash: 'bg-emerald-400/25' },
  amber: { grad: 'from-amber-500 to-orange-500 shadow-amber-500/25', wash: 'bg-amber-400/25' },
  rose: { grad: 'from-rose-500 to-pink-500 shadow-rose-500/25', wash: 'bg-rose-400/25' },
  cyan: { grad: 'from-cyan-500 to-sky-500 shadow-cyan-500/25', wash: 'bg-cyan-400/25' },
  violet: { grad: 'from-violet-500 to-fuchsia-500 shadow-violet-500/25', wash: 'bg-violet-400/25' },
};

export function StatCard({ icon: Icon, label, value, delta, tone = 'brand', onClick, sub, delay }) {
  const t = statTones[tone] || statTones.brand;
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      style={delay ? { animationDelay: delay } : undefined}
      className={cx('relative overflow-hidden p-5 group', delay && 'animate-fade-up')}
    >
      <div className={cx('absolute -top-16 -right-12 h-36 w-36 rounded-full blur-3xl opacity-70 pointer-events-none', t.wash)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cx('h-11 w-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:-rotate-3', t.grad)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {delta && (
          <span className={cx('text-xs font-bold px-2 py-1 rounded-lg', delta.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>
            {delta}
          </span>
        )}
      </div>
      <p className="relative mt-4 text-2xl font-display font-extrabold text-slate-900 tracking-tight">{value}</p>
      <p className="relative text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="relative text-xs text-slate-400 mt-1">{sub}</p>}
      {onClick && (
        <ArrowUpRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-500 transition-all duration-200" />
      )}
    </Card>
  );
}

/* ==================== STATES ==================== */
export function Spinner({ className }) {
  return <Loader2 className={cx('w-5 h-5 animate-spin text-brand-500', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner className="w-8 h-8" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton h-9 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="font-display font-bold text-slate-900">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ==================== PAGE HEADER ==================== */
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-6 animate-fade-in">
      {breadcrumb && <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">{breadcrumb}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ==================== TABS ==================== */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit max-w-full overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            'px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all',
            active === t.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {t.label}
          {t.count != null && (
            <span className={cx('ml-1.5 text-xs px-1.5 py-0.5 rounded-md', active === t.value ? 'bg-brand-50 text-brand-600' : 'bg-slate-200 text-slate-500')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ==================== FILE UPLOAD ==================== */
export function FileDrop({ files, onFiles, max = 8, accept = 'image/*,video/*,.pdf,.doc,.docx', hint, className }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const add = (list) => {
    const arr = Array.from(list).slice(0, max - (files?.length || 0));
    onFiles([...(files || []), ...arr]);
  };

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={cx(
          'border-2 border-dashed rounded-2xl px-4 py-8 text-center cursor-pointer transition-all',
          drag ? 'border-brand-500 bg-brand-50/60 scale-[1.01]' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'
        )}
      >
        <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Drop files here or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">{hint || `Images, videos, PDFs · max ${max} files`}</p>
        <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => add(e.target.files)} />
      </div>
      {files?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-xl ring-1 ring-slate-200 bg-white p-2 flex items-center gap-2">
              {f.type?.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileIcon className="w-4 h-4 text-slate-500" />
                </div>
              )}
              <p className="text-xs text-slate-600 truncate flex-1">{f.name}</p>
              <button
                type="button"
                onClick={() => onFiles(files.filter((_, x) => x !== i))}
                className="opacity-0 group-hover:opacity-100 text-rose-500 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== MISC ==================== */
export function Avatar({ name, src, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = String(name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (src) return <img src={src} alt={name} className={cx('rounded-full object-cover ring-2 ring-white shadow', sizes[size])} />;
  return (
    <div className={cx('rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-white font-bold flex items-center justify-center ring-2 ring-white shadow', sizes[size])}>
      {initials}
    </div>
  );
}

export function InfoRow({ label, value, className }) {
  return (
    <div className={cx('flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2', className)}>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium break-words min-w-0">{value || '—'}</span>
    </div>
  );
}

export function GradientDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />;
}
