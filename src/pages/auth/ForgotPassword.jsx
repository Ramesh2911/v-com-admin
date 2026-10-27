import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, ShieldCheck, KeyRound, Fingerprint, Send,
  CheckCircle2, Copy, ExternalLink, Sparkles, ArrowRight,
} from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, useToast } from '../../components/ui';
import logo from '../../../assets/logo.jpeg';

const STEPS = [
  { icon: Mail, title: 'Enter your email', desc: 'We match it against your account' },
  { icon: Send, title: 'Get a reset token', desc: 'Secure one-time link, valid 1 hour' },
  { icon: KeyRound, title: 'Set a new password', desc: 'All sessions will be signed out' },
];

export default function ForgotPassword() {
  const { user } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setSent(true);
      setDevToken(res.data?.data?.resetToken || null);
      toast.success(res.data.message || 'Reset link generated');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(devToken);
      toast.success('Token copied');
    } catch {
      toast.error('Copy failed — select manually');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* ============ Left brand panel ============ */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-black p-12 flex-col justify-between">
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-violet-500/22 blur-3xl animate-drift" />
        <div className="absolute top-1/3 -left-24 w-[380px] h-[380px] rounded-full bg-amber-500/18 blur-3xl animate-drift-slow" />
        <div className="absolute -bottom-40 right-1/4 w-[420px] h-[420px] rounded-full bg-brand-600/25 blur-3xl animate-drift" style={{ animationDelay: '-8s' }} />
        <div className="absolute inset-0 grid-overlay opacity-[0.06] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,6,23,0.75)_100%)] pointer-events-none" />

        {/* brand */}
        <div className="relative animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="V_COM logo"
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/15 shadow-[0_0_60px_-14px_rgba(139,92,246,0.55)] animate-float"
            />
            <div>
              <p className="font-display text-2xl font-extrabold text-white tracking-tight">V_COM</p>
              <p className="text-sm text-violet-200/90">Account recovery</p>
            </div>
          </div>
        </div>

        {/* steps */}
        <div className="relative space-y-6 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 ring-1 ring-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Secure recovery flow
            </span>
            <h2 className="font-display text-4xl xl:text-[2.6rem] font-extrabold text-white leading-[1.15] max-w-lg mt-5">
              Get back in{' '}
              <span className="text-gradient">in three steps</span>.
            </h2>
          </div>

          <div className="relative max-w-lg">
            <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-violet-400/50 via-white/15 to-transparent" />
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="group relative flex items-center gap-4 rounded-2xl bg-white/6 backdrop-blur-sm ring-1 ring-white/10 px-4 py-3.5 hover:bg-white/10 hover:ring-white/20 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${280 + i * 100}ms` }}
                >
                  <div className="relative z-10 h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500/30 to-amber-400/20 ring-1 ring-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <s.icon className="w-5 h-5 text-violet-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                  <span className="ml-auto font-display text-2xl font-extrabold text-white/12 group-hover:text-white/25 transition-colors">
                    0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* trust */}
        <div className="relative flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '620ms' }}>
          {['Token expires in 1h', 'Sessions revoked on reset', 'Audit logged'].map((t) => (
            <span key={t} className="rounded-full bg-white/8 ring-1 ring-white/12 px-3 py-1 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* ============ Right form ============ */}
      <div className="relative flex items-center justify-center p-6 sm:p-10 bg-surface overflow-hidden min-h-screen">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-violet-300/35 blur-3xl animate-drift" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-amber-200/35 blur-3xl animate-drift-slow" />
        <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-200/40 blur-3xl animate-drift" style={{ animationDelay: '-12s' }} />
        <div className="absolute inset-0 grid-overlay-light opacity-[0.04] pointer-events-none" />

        <div className="relative w-full max-w-[440px]">
          {/* mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center animate-fade-up">
            <img src={logo} alt="V_COM logo" className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200 shadow-md" />
            <span className="font-display text-2xl font-extrabold">V_COM</span>
          </div>

          {/* back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-5 animate-fade-up group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to login
          </Link>

          {/* header */}
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" /> Account recovery
            </p>
            <h1 className="font-display text-3xl sm:text-[2.1rem] font-extrabold text-slate-900 tracking-tight mt-2 leading-tight">
              Forgot password?
            </h1>
            <p className="text-slate-500 mt-1.5">Enter your email and we'll generate a secure reset token.</p>
          </div>

          {!sent ? (
            <form
              onSubmit={submit}
              className="mt-7 rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/[0.06] shadow-[0_32px_64px_-32px_rgba(15,23,42,0.4)] p-6 sm:p-7 space-y-4 animate-fade-up"
              style={{ animationDelay: '220ms' }}
            >
              {/* violet accent strip */}
              <div className="h-1.5 -mx-6 -mt-6 sm:-mx-7 sm:-mt-7 mb-1 rounded-t-3xl bg-gradient-to-r from-violet-500 via-brand-500 to-amber-400" />

              <Input
                label="Email address"
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                autoComplete="email"
              />

              <Button type="submit" loading={loading} className="btn-shine w-full h-12 text-base relative overflow-hidden" icon={loading ? undefined : Send}>
                Send reset link
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Fingerprint className="w-3.5 h-3.5" />
                One-time token · Expires in 1 hour · Revokes all sessions
              </p>
            </form>
          ) : (
            <div
              className="mt-7 rounded-3xl bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/[0.06] shadow-[0_32px_64px_-32px_rgba(15,23,42,0.4)] overflow-hidden animate-scale-in"
            >
              {/* success gradient header */}
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 sm:px-7 py-7 overflow-hidden">
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 85% 40%, white 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
                <div className="absolute -top-10 -right-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex flex-col items-center text-center">
                  <span className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur ring-2 ring-white/40 flex items-center justify-center shadow-2xl mb-3 animate-float">
                    <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.2} />
                  </span>
                  <h2 className="font-display text-xl font-extrabold text-white drop-shadow">Check your inbox</h2>
                  <p className="text-sm text-white/85 mt-1">
                    Reset link sent to <span className="font-bold text-white break-all">{email || 'your email'}</span>
                  </p>
                </div>
              </div>

              {/* body */}
              <div className="p-6 sm:p-7 space-y-4">
                <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800">
                    Didn't get it? Check spam, or wait a minute and try again from the login page.
                  </p>
                </div>

                {devToken && (
                  <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Dev token (SMTP not configured)
                      </p>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-[11px] font-bold px-2 py-1 transition"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <code className="block text-[11px] text-amber-900 bg-white/70 rounded-xl p-2.5 break-all font-mono ring-1 ring-amber-100">
                      {devToken}
                    </code>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" className="w-full" icon={ArrowLeft}>Back to login</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    icon={ExternalLink}
                    onClick={() => window.location.reload()}
                  >
                    Try another email
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-5 animate-fade-up" style={{ animationDelay: '460ms' }}>
            © {new Date().getFullYear()} V_COM · Secure account recovery
          </p>
        </div>
      </div>
    </div>
  );
}
