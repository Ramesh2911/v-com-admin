import { useMemo, useState } from 'react';
import {
  UserCircle2, Save, KeyRound, Mail, Phone, ShieldCheck, Eye, EyeOff,
  User, Clock, Sparkles, Lock, Check, Circle, Fingerprint, IdCard,
} from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Card, CardBody, Button, useToast, Input, Badge, InfoRow,
} from '../../components/ui';
import { cx, fmtDate, fmtDateTime, labelize, timeAgo } from '../../lib/utils';

/* ============ password strength ============ */
const strengthOf = (pw) => {
  if (!pw) return { score: 0, label: '', tone: 'slate', checks: [] };
  const checks = [
    { id: 'len', label: 'Min 6 characters', ok: pw.length >= 6 },
    { id: 'upper', label: 'Uppercase letter', ok: /[A-Z]/.test(pw) },
    { id: 'num', label: 'Number', ok: /\d/.test(pw) },
    { id: 'special', label: 'Special symbol', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const map = [
    { tone: 'slate', label: 'Empty', bar: 'bg-slate-300' },
    { tone: 'rose', label: 'Weak', bar: 'bg-rose-500' },
    { tone: 'amber', label: 'Fair', bar: 'bg-amber-500' },
    { tone: 'cyan', label: 'Good', bar: 'bg-cyan-500' },
    { tone: 'emerald', label: 'Strong', bar: 'bg-emerald-500' },
  ];
  const m = map[score] || map[0];
  return { score, label: m.label, tone: m.tone, bar: m.bar, checks };
};

const TYPE_META = {
  admin: { label: 'Admin', grad: 'from-violet-500 to-purple-600', icon: ShieldCheck },
  staff: { label: 'Staff', grad: 'from-cyan-500 to-sky-600', icon: User },
  customer: { label: 'Customer', grad: 'from-brand-500 to-violet-500', icon: User },
  vendor: { label: 'Vendor', grad: 'from-emerald-500 to-teal-600', icon: User },
  employee: { label: 'Employee', grad: 'from-amber-500 to-orange-500', icon: User },
};

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="text-slate-400 hover:text-slate-600 transition-colors"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
    </button>
  );
}

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const strength = useMemo(() => strengthOf(pw.newPassword), [pw.newPassword]);
  const type = TYPE_META[user?.user_type] || TYPE_META.admin;
  const TypeIcon = type.icon;
  const permCount = user?.permissions?.length || 0;

  const saveProfile = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshMe();
      toast.success('Profile updated');
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword) return toast.error('Both password fields required');
    if (pw.newPassword.length < 6) return toast.error('New password min 6 chars');
    setSavingPw(true);
    try {
      await authApi.changePassword(pw);
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e) { toast.error(getError(e)); } finally { setSavingPw(false); }
  };

  return (
    <>
      {/* ============ Hero banner ============ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 shadow-2xl shadow-violet-600/25 animate-fade-up mb-6">
        <div className="absolute inset-0 opacity-12" style={{ backgroundImage: 'radial-gradient(circle at 90% 20%, white 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-fuchsia-400/25 blur-3xl pointer-events-none animate-drift-slow" />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
          {/* avatar */}
          <div className="relative shrink-0">
            <div className="h-28 w-28 rounded-3xl bg-white/15 backdrop-blur-sm ring-2 ring-white/40 p-1.5 shadow-2xl overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                  <span className="font-display text-4xl font-extrabold text-white drop-shadow">
                    {String(user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-400 ring-4 ring-violet-600 flex items-center justify-center shadow-lg shadow-emerald-400/40">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
            </span>
            <span className="absolute -top-1.5 -left-1.5 h-8 w-8 rounded-2xl bg-white/20 backdrop-blur ring-1 ring-white/30 flex items-center justify-center shadow-lg animate-float">
              <Fingerprint className="w-4 h-4 text-white" />
            </span>
          </div>

          {/* identity */}
          <div className="min-w-0 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={cx('inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 ring-1 ring-white/30')}>
                <TypeIcon className="w-3 h-3" /> {type.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 text-violet-700 text-[11px] font-bold px-2.5 py-1 shadow">
                <ShieldCheck className="w-3 h-3" /> {user?.role_name || 'No role'}
              </span>
              <span className={cx(
                'inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold px-2.5 py-1 ring-1',
                user?.status === 'active'
                  ? 'bg-emerald-400/90 text-white ring-emerald-300/50'
                  : 'bg-rose-400/90 text-white ring-rose-300/50'
              )}>
                <span className={cx('h-1.5 w-1.5 rounded-full bg-white', user?.status === 'active' && 'animate-pulse')} />
                {labelize(user?.status || 'active')}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow tracking-tight">{user?.name}</h1>
            <p className="text-sm text-white/75 mt-1 flex items-center justify-center sm:justify-start gap-1.5 break-all">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {user?.email}
            </p>
          </div>

          {/* mini stats */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            {[
              { icon: Sparkles, label: 'Access', value: permCount, sub: 'permissions' },
              { icon: IdCard, label: 'Since', value: fmtDate(user?.created_at, 'YYYY'), sub: fmtDate(user?.created_at, 'DD MMM') },
              { icon: Clock, label: 'Login', value: timeAgo(user?.last_login_at), sub: 'last seen' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 px-3.5 py-3 text-center min-w-[92px]">
                <s.icon className="w-4 h-4 text-white/80 mx-auto mb-1" />
                <p className="text-base font-extrabold text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/70 mt-1 font-medium">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ Content grid ============ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Account overview */}
        <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '60ms' }}>
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-5 py-4 overflow-hidden">
            <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-brand-500/30 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </span>
              <div>
                <h3 className="font-display font-bold text-white">Account</h3>
                <p className="text-xs text-slate-400">Your identity on V_COM</p>
              </div>
            </div>
          </div>
          <CardBody className="divide-y divide-slate-50">
            <InfoRow label="Phone" value={user?.phone || '—'} />
            <InfoRow label="User type" value={labelize(user?.user_type || '—')} />
            <InfoRow label="Role" value={user?.role_name || '—'} />
            <InfoRow label="Status" value={
              <Badge tone={user?.status === 'active' ? 'emerald' : 'rose'} dot>{labelize(user?.status || 'active')}</Badge>
            } />
            <InfoRow label="Member since" value={fmtDate(user?.created_at, 'DD MMM YYYY')} />
            <InfoRow label="Last login" value={
              <span title={fmtDateTime(user?.last_login_at)}>
                {fmtDateTime(user?.last_login_at)}
              </span>
            } />
          </CardBody>
        </Card>

        {/* Personal details + Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal details */}
          <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '100ms' }}>
            <div className="relative bg-gradient-to-br from-brand-500 to-violet-500 px-5 py-4 overflow-hidden">
              <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 85% 40%, white 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
              <div className="relative flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30 flex items-center justify-center shadow-lg">
                  <UserCircle2 className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-white">Personal details</h3>
                  <p className="text-xs text-white/80">Update your name and contact info</p>
                </div>
              </div>
            </div>
            <CardBody className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full name"
                  icon={User}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
                <Input
                  label="Email"
                  icon={Mail}
                  value={form.email}
                  disabled
                  hint="Email cannot be changed"
                />
                <Input
                  label="Phone"
                  icon={Phone}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91…"
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button icon={Save} loading={saving} onClick={saveProfile} className="btn-shine relative overflow-hidden">
                  Save changes
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Security */}
          <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '140ms' }}>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-4 overflow-hidden">
              <div className="absolute -top-10 -right-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30 flex items-center justify-center shadow-lg">
                  <Lock className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-white">Security</h3>
                  <p className="text-xs text-white/80">Change your account password</p>
                </div>
              </div>
            </div>
            <CardBody>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Current password"
                  icon={KeyRound}
                  type={showCur ? 'text' : 'password'}
                  value={pw.currentPassword}
                  onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  suffix={<EyeToggle show={showCur} onToggle={() => setShowCur(!showCur)} />}
                />
                <Input
                  label="New password"
                  icon={Lock}
                  type={showNew ? 'text' : 'password'}
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  placeholder="••••••••"
                  suffix={<EyeToggle show={showNew} onToggle={() => setShowNew(!showNew)} />}
                />
              </div>

              {/* strength meter */}
              {pw.newPassword && (
                <div className="mt-4 animate-fade-up">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-slate-600">Password strength</p>
                    <span className={cx(
                      'text-xs font-bold px-2 py-0.5 rounded-md ring-1',
                      strength.tone === 'emerald' && 'bg-emerald-50 text-emerald-600 ring-emerald-200',
                      strength.tone === 'cyan' && 'bg-cyan-50 text-cyan-600 ring-cyan-200',
                      strength.tone === 'amber' && 'bg-amber-50 text-amber-600 ring-amber-200',
                      strength.tone === 'rose' && 'bg-rose-50 text-rose-600 ring-rose-200',
                    )}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div key={seg} className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cx('h-full rounded-full transition-all duration-300', strength.bar)}
                          style={{ width: strength.score >= seg ? '100%' : '0%' }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                    {strength.checks.map((c) => (
                      <p key={c.id} className="flex items-center gap-1.5 text-xs">
                        {c.ok
                          ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
                          : <Circle className="w-3 h-3 text-slate-300 shrink-0" />}
                        <span className={c.ok ? 'text-slate-700 font-medium' : 'text-slate-400'}>{c.label}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-5">
                <Button variant="success" icon={KeyRound} loading={savingPw} onClick={changePassword} className="btn-shine relative overflow-hidden">
                  Update password
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
