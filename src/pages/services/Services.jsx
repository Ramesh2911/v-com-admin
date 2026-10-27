import { useCallback, useEffect, useState } from 'react';
import {
  Palette, Plus, Pencil, Trash2, RotateCcw, Layers, SearchX, Hash,
  FolderOpen, Sparkles, Eye, EyeOff, Star, Package,
  Recycle, Camera, Flame, Hammer, Gift, Wrench,
} from 'lucide-react';
import { servicesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Button, EmptyState, Table, TH, TD, TRow,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select,
  TableSkeleton, StatCard,
} from '../../components/ui';
import { cx } from '../../lib/utils';

/* ============ Per-module vivid themes (eye-catch) ============ */
const MODULE_THEMES = {
  recycle: {
    grad: 'from-emerald-400 via-teal-500 to-cyan-500',
    glow: 'shadow-emerald-500/30',
    ring: 'hover:ring-emerald-300',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: Recycle,
    emoji: '♻️',
  },
  cctv: {
    grad: 'from-sky-400 via-blue-500 to-indigo-500',
    glow: 'shadow-sky-500/30',
    ring: 'hover:ring-sky-300',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    icon: Camera,
    emoji: '📷',
  },
  flame: {
    grad: 'from-rose-400 via-red-500 to-orange-500',
    glow: 'shadow-rose-500/30',
    ring: 'hover:ring-rose-300',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200',
    icon: Flame,
    emoji: '🔥',
  },
  hammer: {
    grad: 'from-amber-400 via-orange-500 to-yellow-500',
    glow: 'shadow-amber-500/30',
    ring: 'hover:ring-amber-300',
    chip: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Hammer,
    emoji: '🔨',
  },
  palette: {
    grad: 'from-violet-400 via-purple-500 to-fuchsia-500',
    glow: 'shadow-violet-500/30',
    ring: 'hover:ring-violet-300',
    chip: 'bg-violet-50 text-violet-700 ring-violet-200',
    icon: Palette,
    emoji: '🎨',
  },
  gift: {
    grad: 'from-pink-400 via-rose-500 to-red-500',
    glow: 'shadow-pink-500/30',
    ring: 'hover:ring-pink-300',
    chip: 'bg-pink-50 text-pink-700 ring-pink-200',
    icon: Gift,
    emoji: '🎁',
  },
};

const FALLBACK_THEME = {
  grad: 'from-brand-400 via-violet-500 to-fuchsia-500',
  glow: 'shadow-brand-500/30',
  ring: 'hover:ring-brand-300',
  chip: 'bg-brand-50 text-brand-700 ring-brand-200',
  icon: Layers,
  emoji: '📦',
};

const themeFor = (m) => MODULE_THEMES[m?.icon] || MODULE_THEMES[m?.code] || FALLBACK_THEME;

/* icon picker options for the module form */
const ICON_OPTIONS = [
  { v: 'recycle', label: '♻️ Recycle' },
  { v: 'cctv', label: '📷 CCTV' },
  { v: 'flame', label: '🔥 Flame' },
  { v: 'hammer', label: '🔨 Hammer' },
  { v: 'palette', label: '🎨 Palette' },
  { v: 'gift', label: '🎁 Gift' },
  { v: 'wrench', label: '🔧 Wrench' },
  { v: 'megaphone', label: '📣 Megaphone' },
  { v: 'paintbrush', label: '🖌️ Paintbrush' },
];

export default function Services() {
  const toast = useToast();
  const [tab, setTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [catModal, setCatModal] = useState(null);
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', icon: '', sort_order: 0, status: 1 });
  const [catForm, setCatForm] = useState({ module_id: '', name: '', description: '', is_featured: 0, status: 1, sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([servicesApi.modules(), servicesApi.categories()])
      .then(([m, c]) => { setModules(m.data.data); setCategories(c.data.data); })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const saveModule = async () => {
    if (!form.name || !form.code) return toast.error('Code and name required');
    setSaving(true);
    try {
      if (modal === 'new') { await servicesApi.createModule(form); toast.success('Module created'); }
      else { await servicesApi.updateModule(modal.id, form); toast.success('Module updated'); }
      setModal(null); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const saveCategory = async () => {
    if (!catForm.name || !catForm.module_id) return toast.error('Module and name required');
    setSaving(true);
    try {
      if (catModal === 'new') { await servicesApi.createCategory(catForm); toast.success('Category created'); }
      else { await servicesApi.updateCategory(catModal.id, catForm); toast.success('Category updated'); }
      setCatModal(null); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      if (del.kind === 'module') await servicesApi.deleteModule(del.id);
      else await servicesApi.deleteCategory(del.id);
      toast.success('Deleted'); setDel(null); load();
    } catch (e) { toast.error(getError(e)); }
  };

  const totalCats = categories.length;
  const featuredCats = categories.filter((c) => Number(c.is_featured) === 1).length;
  const activeModules = modules.filter((m) => m.status).length;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-lg shadow-fuchsia-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Content
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Services &amp; Content</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage service modules and categories shown in the apps</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Layers} label="Modules" value={modules.length} tone="brand" delay="0ms" />
        <StatCard icon={Eye} label="Active Modules" value={activeModules} tone="emerald" delay="60ms" />
        <StatCard icon={FolderOpen} label="Categories" value={totalCats} tone="cyan" delay="120ms" />
        <StatCard icon={Star} label="Featured" value={featuredCats} tone="amber" delay="180ms" />
      </div>

      {/* ============ Tabs ============ */}
      <div className="mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {[
            { value: 'modules', label: 'Modules', count: modules.length, icon: Layers },
            { value: 'categories', label: 'Categories', count: categories.length, icon: FolderOpen },
          ].map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <t.icon className={cx('w-4 h-4', active ? 'text-fuchsia-500' : 'text-slate-400')} />
                {t.label}
                <span className={cx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-fuchsia-50 text-fuchsia-600' : 'bg-slate-200/80 text-slate-500'
                )}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-52 rounded-2xl" />
            ))}
          </div>
        </Card>
      ) : tab === 'modules' ? (
        modules.length === 0 ? (
          <Card className="animate-fade-up">
            <EmptyState
              icon={Layers}
              title="No modules"
              message="Service modules shown in the customer app appear here."
              action={<Button icon={Plus} onClick={() => { setForm({ code: '', name: '', description: '', icon: '', sort_order: 0, status: 1 }); setModal('new'); }}>Add Module</Button>}
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {modules.map((m, i) => {
              const th = themeFor(m);
              const Ico = th.icon;
              const catCount = m.category_count ?? 0;
              return (
                <Card
                  key={m.id}
                  className="group relative overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* vivid gradient banner */}
                  <div className={cx('relative h-24 bg-gradient-to-br overflow-hidden', th.grad, th.glow)}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
                    {/* big icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-2xl bg-white/25 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                        <Ico className="w-7 h-7 text-white drop-shadow" />
                      </div>
                    </div>
                    {/* status + actions overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge tone={m.status ? 'emerald' : 'slate'} dot className="font-bold bg-white/90 backdrop-blur">
                        {m.status ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>
                    <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                      <button
                        onClick={() => { setForm({ code: m.code, name: m.name, description: m.description || '', icon: m.icon || '', sort_order: m.sort_order, status: m.status }); setModal(m); }}
                        className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur text-slate-700 hover:bg-white hover:text-brand-600 flex items-center justify-center shadow-md transition"
                        aria-label="Edit module"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDel({ ...m, kind: 'module' })}
                        className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center shadow-md transition"
                        aria-label="Delete module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* emoji float */}
                    <span className="absolute bottom-2 right-3 text-2xl drop-shadow-lg select-none opacity-80 group-hover:scale-125 group-hover:-translate-y-1 transition-transform duration-300">
                      {th.emoji}
                    </span>
                  </div>

                  {/* body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{m.name}</h3>
                        <p className="inline-flex items-center gap-1 mt-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                          <Hash className="w-2.5 h-2.5" /> {m.code}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem]">{m.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1', th.chip)}>
                        <FolderOpen className="w-3 h-3" /> {catCount} {catCount === 1 ? 'category' : 'categories'}
                      </span>
                      <Badge tone="slate" className="font-bold">
                        <Wrench className="w-3 h-3" /> {m.request_count ?? 0} requests
                      </Badge>
                      {!m.status && (
                        <Badge tone="rose" className="font-bold"><EyeOff className="w-3 h-3" /> Hidden</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add module — eye-catch dashed card */}
            <button
              onClick={() => { setForm({ code: '', name: '', description: '', icon: '', sort_order: 0, status: 1 }); setModal('new'); }}
              className="group rounded-2xl border-2 border-dashed border-slate-200 hover:border-fuchsia-400 hover:bg-gradient-to-br hover:from-fuchsia-50/60 hover:to-pink-50/60 transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] text-slate-400 hover:text-fuchsia-600 animate-fade-up"
              style={{ animationDelay: `${modules.length * 60}ms` }}
            >
              <span className="h-14 w-14 rounded-2xl bg-slate-100 group-hover:bg-fuchsia-100 flex items-center justify-center mb-3 transition-colors">
                <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
              </span>
              <span className="text-sm font-semibold">Add Module</span>
              <span className="text-xs text-slate-400 group-hover:text-fuchsia-500 mt-0.5">New service for the apps</span>
            </button>
          </div>
        )
      ) : (
        /* ============ Categories table ============ */
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/25 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Categories</h3>
                <p className="text-sm text-slate-500">{categories.length} categories across modules</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => { setCatForm({ module_id: modules[0]?.id || '', name: '', description: '', is_featured: 0, status: 1, sort_order: 0 }); setCatModal('new'); }}>Add Category</Button>
          </div>
          {categories.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No categories"
              message="Categories appear inside each service module in the apps."
              action={<Button icon={Plus} onClick={() => { setCatForm({ module_id: modules[0]?.id || '', name: '', description: '', is_featured: 0, status: 1, sort_order: 0 }); setCatModal('new'); }}>Add Category</Button>}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>Category</TH>
                  <TH>Module</TH>
                  <TH>Featured</TH>
                  <TH>Status</TH>
                  <TH align="right">Actions</TH>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, i) => {
                  const mod = modules.find((m) => m.id === c.module_id);
                  const th = themeFor(mod);
                  const Ico = th.icon;
                  return (
                    <TRow key={c.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <span className={cx('h-9 w-9 rounded-xl bg-gradient-to-br shadow-md flex items-center justify-center shrink-0', th.grad, th.glow)}>
                            <Ico className="w-4 h-4 text-white" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[320px]">{c.description}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1', th.chip)}>
                          <Ico className="w-3 h-3" /> {c.module_name}
                        </span>
                      </TD>
                      <TD>
                        {Number(c.is_featured) === 1 ? (
                          <Badge tone="amber" className="font-bold"><Star className="w-3 h-3 fill-current" /> Featured</Badge>
                        ) : <span className="text-slate-400 text-sm">—</span>}
                      </TD>
                      <TD>
                        <Badge tone={c.status ? 'emerald' : 'slate'} dot className="font-bold">
                          {c.status ? 'Active' : 'Hidden'}
                        </Badge>
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => { setCatForm({ module_id: c.module_id, name: c.name, description: c.description || '', is_featured: Number(c.is_featured), status: c.status, sort_order: c.sort_order }); setCatModal(c); }}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ ...c, kind: 'category' })}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TD>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ============ Module modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Add module' : 'Edit module'}
        subtitle={modal === 'new' ? 'New service module for the apps' : `${modal?.name} · ${modal?.code}`}
        icon={Layers}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={saveModule} icon={modal === 'new' ? Plus : Pencil}>
              {modal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* live preview */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className={cx('relative h-16 bg-gradient-to-br flex items-center gap-3 px-4', themeFor({ icon: form.icon, code: form.code }).grad)}>
              <span className="h-9 w-9 rounded-xl bg-white/25 backdrop-blur ring-1 ring-white/40 flex items-center justify-center">
                {(() => { const Ico = themeFor({ icon: form.icon, code: form.code }).icon; return <Ico className="w-4.5 h-4.5 text-white" />; })()}
              </span>
              <div>
                <p className="font-display font-bold text-white text-sm drop-shadow">{form.name || 'Module name'}</p>
                <p className="font-mono text-[10px] text-white/80">{form.code || 'module-code'}</p>
              </div>
              <span className="ml-auto text-2xl select-none">{themeFor({ icon: form.icon, code: form.code }).emoji}</span>
            </div>
          </div>
          <Input label="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="solar-energy" disabled={modal !== 'new'} icon={Hash} />
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={Layers} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl">
              {ICON_OPTIONS.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setForm({ ...form, icon: o.v })}
                  className={cx(
                    'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                    form.icon === o.v
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}>
              <option value={1}>Active</option><option value={0}>Hidden</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* ============ Category modal ============ */}
      <Modal
        open={!!catModal}
        onClose={() => setCatModal(null)}
        title={catModal === 'new' ? 'Add category' : 'Edit category'}
        subtitle={catModal === 'new' ? 'New category inside a module' : catModal?.name}
        icon={Palette}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={saveCategory} icon={catModal === 'new' ? Plus : Pencil}>
              {catModal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Module" required value={catForm.module_id} onChange={(e) => setCatForm({ ...catForm, module_id: e.target.value })}>
            <option value="">Select…</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Input label="Name" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} icon={FolderOpen} />
          <Textarea label="Description" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Sort" type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: e.target.value })} />
            <Select label="Featured" value={catForm.is_featured} onChange={(e) => setCatForm({ ...catForm, is_featured: Number(e.target.value) })}>
              <option value={0}>No</option><option value={1}>Yes</option>
            </Select>
            <Select label="Status" value={catForm.status} onChange={(e) => setCatForm({ ...catForm, status: Number(e.target.value) })}>
              <option value={1}>Active</option><option value={0}>Hidden</option>
            </Select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={doDelete} title="Delete?" message={`${del?.name} will be permanently removed.`} confirmText="Delete" />
    </>
  );
}
