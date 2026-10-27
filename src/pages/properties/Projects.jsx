import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Layers, Plus, Pencil, Trash2, RotateCcw, SearchX, LayoutGrid, List,
  Building2, FolderKanban, Home, User, FolderOpen,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Button, EmptyState,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select, SearchInput,
  TableSkeleton,
} from '../../components/ui';
import { cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-slate-400' },
];

export default function Projects() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [builderFilter, setBuilderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('grid');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ builder_id: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([propertiesApi.projects(), propertiesApi.builders()])
      .then(([p, b]) => { setItems(p.data.data); setBuilders(b.data.data); })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const openNew = () => { setForm({ builder_id: '', name: '', description: '' }); setModal('new'); };
  const openEdit = (p) => { setForm({ builder_id: p.builder_id, name: p.name, description: p.description || '' }); setModal(p); };

  const save = async () => {
    if (!form.name || !form.builder_id) return toast.error('Builder and name are required');
    setSaving(true);
    try {
      if (modal === 'new') {
        await propertiesApi.createProject(form);
        toast.success('Project created');
      } else {
        await propertiesApi.updateProject(modal.id, form);
        toast.success('Project updated');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await propertiesApi.deleteProject(del.id);
      toast.success('Project deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    }
  };

  const filtered = items.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.builder_name?.toLowerCase().includes(q);
    const matchesBuilder = !builderFilter || p.builder_id === Number(builderFilter);
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && p.status) ||
      (statusFilter === 'inactive' && !p.status);
    return matchesSearch && matchesBuilder && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((p) => p.status).length,
    inactive: items.filter((p) => !p.status).length,
    properties: items.reduce((s, p) => s + Number(p.property_count || 0), 0),
  }), [items]);

  const statusCounts = useMemo(() => ({
    active: items.filter((p) => p.status).length,
    inactive: items.filter((p) => !p.status).length,
  }), [items]);

  const builderName = (id) => builders.find((b) => b.id === id)?.name;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center shrink-0">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-sm text-slate-500 mt-0.5">Projects under each builder</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openNew}>Add Project</Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon={Layers} label="Total Projects" value={stats.total} grad="from-cyan-500 to-sky-500" delay="0ms" />
        <StatTile icon={FolderOpen} label="Active" value={stats.active} grad="from-emerald-500 to-teal-500" delay="60ms" />
        <StatTile icon={FolderKanban} label="Inactive" value={stats.inactive} grad="from-slate-400 to-slate-500" delay="120ms" />
        <StatTile icon={Home} label="Properties" value={stats.properties} grad="from-amber-500 to-orange-500" delay="180ms" />
      </div>

      {/* ============ Status chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {STATUS_TABS.map((t) => {
            const active = statusFilter === t.value;
            const count = t.value ? statusCounts[t.value] : stats.total;
            return (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                {t.label}
                <span className={cx(
                  'ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-200/80 text-slate-500'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search projects or builders…"
            className="flex-1 min-w-[220px]"
          />
          <Select value={builderFilter} onChange={(e) => setBuilderFilter(e.target.value)} className="w-48">
            <option value="">All builders</option>
            {builders.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { v: 'grid', icon: LayoutGrid, label: 'Grid view' },
              { v: 'table', icon: List, label: 'Table view' },
            ].map((v) => (
              <button
                key={v.v}
                onClick={() => setView(v.v)}
                title={v.label}
                aria-label={v.label}
                className={cx(
                  'p-1.5 rounded-lg transition-all duration-150',
                  view === v.v ? 'bg-white text-cyan-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || builderFilter || statusFilter) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setBuilderFilter(''); setStatusFilter(''); }}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          {view === 'table' ? (
            <TableSkeleton rows={6} cols={5} />
          ) : (
            <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No projects"
            message="Projects appear here — each project belongs to a builder and groups property listings."
            action={
              (search || builderFilter || statusFilter) ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setBuilderFilter(''); setStatusFilter(''); }}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={openNew}>Add Project</Button>
              )
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <Card
              key={p.id}
              hover
              className="relative overflow-hidden p-5 group animate-fade-up"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <Badge tone={p.status ? 'emerald' : 'slate'} dot className="font-bold">
                  {p.status ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <h3 className="relative font-display font-bold text-slate-900 text-lg">{p.name}</h3>
              {p.description && (
                <p className="relative text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              )}
              <div className="relative flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 ring-1 ring-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {p.builder_name || '—'}
                </span>
              </div>
              <div className="relative mt-4 rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
                <Home className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="font-display font-extrabold text-slate-900 text-lg">{p.property_count ?? 0}</p>
                <p className="text-[11px] text-slate-500">Properties</p>
              </div>
              <div className="relative flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <Button size="sm" variant="secondary" icon={Pencil} className="flex-1" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDel(p)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Project</TH>
                <TH>Builder</TH>
                <TH>Properties</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <TRow key={p.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[300px]">{p.description}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {p.builder_name || '—'}
                    </span>
                  </TD>
                  <TD><Badge tone="amber" className="font-bold">{p.property_count ?? 0}</Badge></TD>
                  <TD><Badge tone={p.status ? 'emerald' : 'slate'} dot>{p.status ? 'Active' : 'Inactive'}</Badge></TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel(p)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ============ Create / Edit modal ============ */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Add project' : 'Edit project'}
        subtitle={modal === 'new' ? 'New project under a builder' : modal?.name}
        icon={Layers}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={modal === 'new' ? Plus : Pencil}>
              {modal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Builder" required value={form.builder_id} onChange={(e) => setForm({ ...form, builder_id: e.target.value })}>
            <option value="">Select builder…</option>
            {builders.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Input
            label="Name" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Skyline Residency"
            icon={Layers}
          />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {form.builder_id && (
            <div className="rounded-xl bg-cyan-50 ring-1 ring-cyan-100 p-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <p className="text-xs text-cyan-800">
                This project will be listed under <b>{builderName(Number(form.builder_id))}</b> and selectable in the property form.
              </p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete project?" message={`${del?.name} will be removed.`} confirmText="Delete" />
    </>
  );
}

/* ---------- Local StatTile ---------- */
function StatTile({ icon: Icon, label, value, grad, delay }) {
  return (
    <Card
      style={{ animationDelay: delay }}
      className="relative overflow-hidden p-5 group animate-fade-up"
    >
      <div className="absolute -top-14 -right-12 h-32 w-32 rounded-full bg-slate-400/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cx('h-11 w-11 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:-rotate-3', grad)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="relative mt-4 text-2xl font-display font-extrabold text-slate-900 tracking-tight">{value ?? 0}</p>
      <p className="relative text-sm text-slate-500 mt-0.5">{label}</p>
    </Card>
  );
}
