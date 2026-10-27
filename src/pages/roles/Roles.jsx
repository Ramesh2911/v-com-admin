import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, Plus, Pencil, Trash2, RotateCcw, Users, SearchX, KeyRound,
  Building2, Sparkles, Check, Layers, Shield, UserCog, Lock,
} from 'lucide-react';
import { rolesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Button, PageLoader, EmptyState,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, StatCard,
} from '../../components/ui';
import { labelize, cx } from '../../lib/utils';

const GROUP_ICONS = {
  modules: Layers,
  properties: Building2,
  requests: Shield,
  jobs: UserCog,
  hr: Users,
  reports: ShieldCheck,
  settings: Lock,
  support: KeyRound,
};

export default function Roles() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', permission_ids: [] });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [permSearch, setPermSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    rolesApi.list().then((r) => setData(r.data.data)).catch((e) => toast.error(getError(e))).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const togglePerm = (id) => {
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(id) ? f.permission_ids.filter((x) => x !== id) : [...f.permission_ids, id],
    }));
  };

  const save = async () => {
    if (!form.name || !form.slug) return toast.error('Name and slug required');
    setSaving(true);
    try {
      if (modal === 'new') { await rolesApi.create(form); toast.success('Role created'); }
      else { await rolesApi.update(modal.id, form); toast.success('Role updated'); }
      setModal(null); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const remove = async () => {
    try { await rolesApi.remove(del.id); toast.success('Role deleted'); setDel(null); load(); }
    catch (e) { toast.error(getError(e)); }
  };

  const stats = useMemo(() => {
    if (!data) return { roles: 0, system: 0, users: 0, perms: 0 };
    return {
      roles: data.roles.length,
      system: data.roles.filter((r) => r.is_system || r.is_config === 1).length,
      users: data.roles.reduce((s, r) => s + Number(r.user_count || 0), 0),
      perms: data.permissions?.length || 0,
    };
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const q = permSearch.toLowerCase();
    return Object.entries(data.permission_groups)
      .map(([module, perms]) => [
        module,
        q ? perms.filter((p) => p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)) : perms,
      ])
      .filter(([, perms]) => perms.length > 0);
  }, [data, permSearch]);

  if (loading) return <PageLoader label="Loading roles…" />;
  if (!data) return <EmptyState icon={ShieldCheck} title="No roles" />;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" /> Access Control
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Roles &amp; Permissions</h1>
            <p className="text-sm text-slate-500 mt-0.5">Role-based access control for the entire platform</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => { setForm({ name: '', slug: '', description: '', permission_ids: [] }); setPermSearch(''); setModal('new'); }}>Create Role</Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ShieldCheck} label="Roles" value={stats.roles} tone="emerald" delay="0ms" />
        <StatCard icon={Shield} label="System Roles" value={stats.system} tone="cyan" delay="60ms" sub="Protected" />
        <StatCard icon={Users} label="Assigned Users" value={stats.users} tone="violet" delay="120ms" />
        <StatCard icon={KeyRound} label="Permissions" value={stats.perms} tone="amber" delay="180ms" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ Roles list ============ */}
        <div className="lg:col-span-1 space-y-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 animate-fade-up">
            <UserCog className="w-3.5 h-3.5 text-emerald-500" /> Roles ({stats.roles})
          </p>
          {data.roles.map((r, i) => (
            <Card
              key={r.id}
              hover={!r.is_system}
              className="relative overflow-hidden p-4 group animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5 text-white" />
                    </span>
                    <h3 className="font-display font-bold text-slate-900">{r.name}</h3>
                    {(r.is_config === 1 || r.is_system) ? <Badge tone="brand" className="font-bold">System</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 pl-11">{r.description}</p>
                  <div className="flex gap-2 mt-2 pl-11">
                    <Badge tone="cyan" className="font-bold"><Users className="w-3 h-3" /> {r.user_count} users</Badge>
                    <Badge tone="violet" className="font-bold"><KeyRound className="w-3 h-3" /> {r.permission_count} perms</Badge>
                  </div>
                </div>
                {!r.is_system && (
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" title="Edit" onClick={() => { setForm({ name: r.name, slug: r.slug, description: r.description || '', permission_ids: r.permission_ids }); setModal(r); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel(r)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* ============ Permission catalogue ============ */}
        <Card className="lg:col-span-2 animate-fade-up overflow-hidden" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Permission catalogue</h3>
                <p className="text-sm text-slate-500">All permission codes grouped by module</p>
              </div>
            </div>
            <Badge tone="emerald" className="font-bold">{stats.perms} codes</Badge>
          </div>
          <CardBody className="space-y-5">
            {Object.entries(data.permission_groups).map(([module, perms], gi) => {
              const Ico = GROUP_ICONS[module] || Layers;
              return (
                <div key={module} className="animate-fade-up" style={{ animationDelay: `${gi * 40}ms` }}>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                      <Ico className="w-3 h-3 text-white" />
                    </span>
                    {labelize(module)}
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 rounded-md px-1.5 py-0.5">{perms.length}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-xs hover:bg-emerald-50 hover:ring-emerald-200 transition-colors">
                        <code className="text-brand-600 font-semibold">{p.code}</code>
                        <span className="text-slate-500">{p.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* ============ Role editor modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Create role' : `Edit ${modal?.name}`}
        subtitle="Name, slug and module permissions"
        icon={ShieldCheck}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={modal === 'new' ? Plus : Pencil}>Save role</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Role name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Billing Manager" icon={ShieldCheck} />
            <Input label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="billing_manager" disabled={modal !== 'new'} icon={KeyRound} />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" rows={2} />
          </div>

          <div>
            {/* header + counter */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Permissions
                <span className="text-[11px] font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 rounded-md px-2 py-0.5">
                  {form.permission_ids.length} / {data.permissions.length} selected
                </span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Search permissions…"
                  className="rounded-lg border-0 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-transparent placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-brand-500 transition w-40"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  onClick={() => setForm((f) => ({ ...f, permission_ids: data.permissions.map((p) => p.id) }))}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  onClick={() => setForm((f) => ({ ...f, permission_ids: [] }))}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto dark-scroll pr-2 rounded-xl">
              {filteredGroups.map(([module, perms], gi) => {
                const Ico = GROUP_ICONS[module] || Layers;
                const selectedInGroup = perms.filter((p) => form.permission_ids.includes(p.id)).length;
                const allSelected = selectedInGroup === perms.length;
                return (
                  <div
                    key={module}
                    className="rounded-xl ring-1 ring-slate-100 overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${gi * 30}ms` }}
                  >
                    {/* group header */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                          <Ico className="w-3 h-3 text-white" />
                        </span>
                        {labelize(module)}
                        <span className={cx(
                          'text-[10px] font-bold rounded-md px-1.5 py-0.5',
                          allSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        )}>
                          {selectedInGroup}/{perms.length}
                        </span>
                      </p>
                      <button
                        type="button"
                        className={cx(
                          'text-[11px] font-bold px-2 py-1 rounded-md transition-colors',
                          allSelected ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                        )}
                        onClick={() => setForm((f) => ({
                          ...f,
                          permission_ids: allSelected
                            ? f.permission_ids.filter((id) => !perms.some((p) => p.id === id))
                            : [...new Set([...f.permission_ids, ...perms.map((p) => p.id)])],
                        }))}
                      >
                        {allSelected ? 'None' : 'All'}
                      </button>
                    </div>
                    {/* perms grid */}
                    <div className="grid sm:grid-cols-2 gap-1.5 p-2">
                      {perms.map((p) => {
                        const checked = form.permission_ids.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={cx(
                              'flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-150',
                              checked ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                            )}
                          >
                            <span
                              className={cx(
                                'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                              )}
                            >
                              {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePerm(p.id)}
                              className="sr-only"
                            />
                            <div className="min-w-0">
                              <p className={cx('text-sm font-medium truncate', checked ? 'text-emerald-800' : 'text-slate-800')}>{p.label}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{p.code}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filteredGroups.length === 0 && (
                <EmptyState icon={SearchX} title="No permissions match" message="Try a different search term." />
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete role?" message={`${del?.name} will be removed. Reassign its users first.`} confirmText="Delete" />
    </>
  );
}
