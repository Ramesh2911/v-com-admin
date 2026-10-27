import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Zap, ArrowRight, MousePointerClick, KeyRound, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, useToast } from '../../components/ui';
import { getError } from '../../api/client';
import logo from '../../../assets/logo.jpeg';

const FEATURES = [
  { icon: Zap, text: 'Requests, quotations & job workflows' },
  { icon: ShieldCheck, text: 'Vendors, SOS emergency & HR modules' },
  { icon: MousePointerClick, text: 'Properties with builder / project / area search' },
];

const STATS = [
  { value: '6', label: 'Service modules' },
  { value: '3', label: 'Companion apps' },
  { value: '24/7', label: 'SOS response' },
];

const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@vcom.com', pw: 'Admin@123', hover: 'hover:ring-brand-400 hover:bg-brand-50/70 hover:shadow-md' },
  { label: 'Operations', email: 'ops@vcom.com', pw: 'Ops@123', hover: 'hover:ring-violet-400 hover:bg-violet-50/70 hover:shadow-md' },
  { label: 'HR Manager', email: 'hr@vcom.com', pw: 'Hr@12345', hover: 'hover:ring-emerald-400 hover:bg-emerald-50/70 hover:shadow-md' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('admin@vcom.com');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to V_COM');
      navigate('/');
    } catch (err) {
      toast.error(getError(err), 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pw);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ============ Left brand panel ============ */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-black p-12 flex-col justify-between">
        {/* aurora orbs */}
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-brand-500/25 blur-3xl animate-drift" />
        <div className="absolute top-1/3 -left-24 w-[380px] h-[380px] rounded-full bg-emerald-500/20 blur-3xl animate-drift-slow" />
        <div className="absolute -bottom-40 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-600/25 blur-3xl animate-drift" style={{ animationDelay: '-8s' }} />
        {/* fine grid */}
        <div className="absolute inset-0 grid-overlay opacity-[0.06] pointer-events-none" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,6,23,0.75)_100%)] pointer-events-none" />

        {/* brand */}
        <div className="relative animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="V_COM logo"
              className="h-24 w-24 rounded-2xl object-cover ring-1 ring-white/15 shadow-[0_0_60px_-14px_rgba(34,197,94,0.55)] animate-float"
            />
            <div>
              <p className="font-display text-2xl font-extrabold text-white tracking-tight">V_COM</p>
              <p className="text-sm text-brand-200/90">Business Management Platform</p>
            </div>
          </div>
        </div>

        {/* headline + features */}
        <div className="relative space-y-8 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 ring-1 ring-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              The OS for service businesses
            </span>
            <h2 className="font-display text-4xl xl:text-[2.75rem] font-extrabold text-white leading-[1.15] max-w-lg mt-5">
              Run your entire service ecosystem from{' '}
              <span className="text-gradient">one powerful panel</span>.
            </h2>
          </div>

          <div className="grid gap-3 max-w-lg">
            {FEATURES.map((f, i) => (
              <div
                key={f.text}
                className="group flex items-center gap-3.5 rounded-2xl bg-white/6 backdrop-blur-sm ring-1 ring-white/10 px-4 py-3.5 hover:bg-white/10 hover:ring-white/20 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${300 + i * 90}ms` }}
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400/25 to-emerald-400/20 ring-1 ring-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <f.icon className="w-4.5 h-4.5 text-brand-300" />
                </div>
                <p className="text-sm text-slate-200">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* stats + trust */}
        <div className="relative animate-fade-up" style={{ animationDelay: '640ms' }}>
          <div className="grid grid-cols-3 gap-4 max-w-lg mb-6">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3.5">
                <p className="font-display text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['Role-based access', 'Audit trails', 'In-app notifications'].map((t) => (
              <span key={t} className="rounded-full bg-white/8 ring-1 ring-white/12 px-3 py-1 text-[11px] font-semibold text-slate-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Right form ============ */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-surface overflow-hidden">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-brand-300/35 blur-3xl animate-drift" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl animate-drift-slow" />
        <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl animate-drift" style={{ animationDelay: '-12s' }} />
        <div className="absolute inset-0 grid-overlay-light opacity-[0.04] pointer-events-none" />

        <div className="relative w-full max-w-[440px]">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center animate-fade-up">
            <img
              src={logo}
              alt="V_COM logo"
              className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200 shadow-md"
            />
            <span className="font-display text-2xl font-extrabold">V_COM</span>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Welcome back</p>
            <h1 className="font-display text-3xl sm:text-[2.1rem] font-extrabold text-slate-900 tracking-tight mt-2 leading-tight">
              Sign in to your panel
            </h1>
            <p className="text-slate-500 mt-1.5">Use your credentials to access the admin console.</p>
          </div>

          <form
            onSubmit={submit}
            className="mt-7 rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/[0.06] shadow-[0_32px_64px_-32px_rgba(15,23,42,0.4)] p-6 sm:p-7 space-y-4 animate-fade-up"
            style={{ animationDelay: '220ms' }}
          >
            <Input
              label="Email address"
              type="email"
              required
              placeholder="admin@vcom.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={show ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              autoComplete="current-password"
              suffix={
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  tabIndex={-1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="btn-shine w-full h-12 text-base" icon={loading ? undefined : KeyRound}>
              Sign in
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <Fingerprint className="w-3.5 h-3.5" />
              Protected by JWT · Auto session refresh · RBAC enforced
            </p>
          </form>

          {/* demo accounts */}
          <div
            className="mt-5 rounded-3xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/[0.06] shadow-xl shadow-slate-900/[0.04] p-5 animate-fade-up"
            style={{ animationDelay: '360ms' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Demo accounts</p>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Click to autofill
              </span>
            </div>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => autofill(acc)}
                  className={`group flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-slate-200 hover:ring-2 transition-all duration-150 text-left ${acc.hover}`}
                >
                  <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{acc.label}</span>
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-600 transition-colors">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5 animate-fade-up" style={{ animationDelay: '460ms' }}>
            © {new Date().getFullYear()} V_COM · Trusted by ops teams
          </p>
        </div>
      </div>
    </div>
  );
}
