import { useEffect, useMemo, useState } from 'react';
import {
  Settings2, Save, RotateCcw, SlidersHorizontal, IndianRupee, Siren,
  Building2, GitBranch, Check, AlertTriangle,
} from 'lucide-react';
import { settingsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Button, PageLoader, useToast, Input, Badge,
} from '../../components/ui';
import { cx, labelize } from '../../lib/utils';

const GROUP_THEMES = {
  general: {
    grad: 'from-brand-500 to-violet-500',
    glow: 'shadow-brand-500/25',
    icon: SlidersHorizontal,
    ring: 'ring-brand-100 bg-brand-50/50',
  },
  pricing: {
    grad: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/25',
    icon: IndianRupee,
    ring: 'ring-emerald-100 bg-emerald-50/50',
  },
  sos: {
    grad: 'from-rose-500 to-red-500',
    glow: 'shadow-rose-500/25',
    icon: Siren,
    ring: 'ring-rose-100 bg-rose-50/50',
  },
  properties: {
    grad: 'from-violet-500 to-fuchsia-500',
    glow: 'shadow-violet-500/25',
    icon: Building2,
    ring: 'ring-violet-100 bg-violet-50/50',
  },
  workflow: {
    grad: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/25',
    icon: GitBranch,
    ring: 'ring-amber-100 bg-amber-50/50',
  },
};

const FALLBACK_THEME = {
  grad: 'from-slate-500 to-slate-600',
  glow: 'shadow-slate-500/25',
  icon: Settings2,
  ring: 'ring-slate-100 bg-slate-50/50',
};

const isBool = (v) => ['0', '1', 'true', 'false'].includes(String(v));
const isOn = (v) => v === '1' || v === 'true';

/* ============ Eye-catch toggle switch ============ */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative h-6.5 w-12 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50',
        checked ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-300'
      )}
    >
      <span
        className={cx(
          'absolute top-1 h-4.5 w-4.5 rounded-full bg-white shadow-md transition-all duration-200',
          checked ? 'left-[calc(100%-1.375rem)]' : 'left-1'
        )}
      >
        {checked && <Check className="w-3 h-3 text-emerald-500 absolute inset-0 m-auto" strokeWidth={3} />}
      </span>
    </button>
  );
}

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    settingsApi
      .get()
      .then((r) => setSettings(r.data.data))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLocal = (key, value) =>
    setSettings((prev) => prev.map((s) => (s.setting_key === key ? { ...s, setting_value: value, is_dirty: true } : s)));

  const resetLocal = () => load();

  const save = async () => {
    const dirty = settings.filter((s) => s.is_dirty);
    if (!dirty.length) return toast.info('Nothing to save');
    const payload = Object.fromEntries(dirty.map((s) => [s.setting_key, s.setting_value]));
    setSaving(true);
    try {
      await settingsApi.update(payload);
      toast.success(`${dirty.length} setting(s) updated`);
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const dirtyCount = useMemo(() => settings.filter((s) => s.is_dirty).length, [settings]);
  const groups = useMemo(() => settings.reduce((acc, s) => {
    (acc[s.setting_group] ||= []).push(s);
    return acc;
  }, {}), [settings]);

  if (loading) return <PageLoader label="Loading settings…" />;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center shrink-0">
            <Settings2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" /> Configuration
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Platform Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {settings.length} configuration keys
              {dirtyCount > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-amber-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {dirtyCount} unsaved
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={resetLocal}>Reset</Button>
          <Button icon={Save} loading={saving} onClick={save} className="btn-shine relative overflow-hidden">
            {dirtyCount ? `Save (${dirtyCount})` : 'Save'}
          </Button>
        </div>
      </div>

      {/* ============ Groups ============ */}
      <div className="grid lg:grid-cols-2 gap-6 pb-24">
        {Object.entries(groups).map(([group, rows], gi) => {
          const th = GROUP_THEMES[group] || FALLBACK_THEME;
          const Icon = th.icon;
          const groupDirty = rows.filter((s) => s.is_dirty).length;
          return (
            <Card
              key={group}
              className="overflow-hidden animate-fade-up"
              style={{ animationDelay: `${gi * 70}ms` }}
            >
              {/* gradient banner header */}
              <div className={cx('relative bg-gradient-to-br px-5 py-4 overflow-hidden', th.grad, th.glow)}>
                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 85% 40%, white 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
                <div className="absolute -top-10 -right-6 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <span className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 flex items-center justify-center shadow-lg">
                    <Icon className="w-5.5 h-5.5 text-white" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-white text-lg drop-shadow capitalize">{group.replace('_', ' ')}</h3>
                    <p className="text-xs text-white/80">{rows.length} settings</p>
                  </div>
                  {groupDirty > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/95 text-amber-600 text-[11px] font-bold px-2.5 py-1 shadow">
                      <AlertTriangle className="w-3 h-3" /> {groupDirty} modified
                    </span>
                  )}
                </div>
              </div>

              {/* rows */}
              <CardBody className="divide-y divide-slate-100 !p-0">
                {rows.map((s, si) => {
                  const bool = isBool(s.setting_value);
                  return (
                    <div
                      key={s.setting_key}
                      className={cx(
                        'flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors animate-fade-up',
                        s.is_dirty ? 'bg-amber-50/60 border-l-4 border-amber-400' : 'border-l-4 border-transparent'
                      )}
                      style={{ animationDelay: `${si * 25}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="text-sm font-semibold text-slate-800">{s.label || labelize(s.setting_key)}</label>
                          {s.is_dirty ? (
                            <Badge tone="amber" className="text-[10px] font-bold">modified</Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 rounded px-1.5 py-0.5">{s.setting_key}</span>
                          )}
                        </div>
                        {bool ? (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Currently <span className={cx('font-bold', isOn(s.setting_value) ? 'text-emerald-500' : 'text-slate-400')}>
                              {isOn(s.setting_value) ? 'Enabled' : 'Disabled'}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0">
                        {bool ? (
                          <Toggle checked={isOn(s.setting_value)} onChange={(v) => updateLocal(s.setting_key, v ? '1' : '0')} />
                        ) : (
                          <Input
                            value={s.setting_value ?? ''}
                            onChange={(e) => updateLocal(s.setting_key, e.target.value)}
                            className="w-44"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ============ Sticky save bar (eye-catch) ============ */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 z-40 animate-fade-up">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10 px-5 py-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</p>
              <p className="text-[11px] text-slate-400 leading-tight">Review and save to apply</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={resetLocal}
                className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition"
              >
                Discard
              </button>
              <Button size="sm" icon={Save} loading={saving} onClick={save} className="btn-shine relative overflow-hidden">
                Save now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
