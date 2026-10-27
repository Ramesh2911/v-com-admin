import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase, Plus, Pencil, Trash2, RotateCcw, SearchX, LayoutGrid, List,
  Building2, FolderKanban, Home, Globe, Phone,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Button, EmptyState,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, SearchInput,
  TableSkeleton,
} from '../../components/ui';
import { mediaUrl, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-slate-400' },
];

export default function Builders() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('grid');
  const [modal, setModal] = useState(null); // {id?} or 'new'
  const [form, setForm] = useState({ name: '', description: '', website: '', contact_phone: '' });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    propertiesApi.builders()
      .then((r) => setItems(r.data.data))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const openNew = () => { setForm({ name: '', description: '', website: '', contact_phone: '' }); setModal('new'); };
  const openEdit = (b) => { setForm({ name: b.name, description: b.description || '', website: b.website || '', contact_phone: b.contact_phone || '' }); setModal(b); };

  const save = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (modal === 'new') {
        await propertiesApi.createBuilder(form);
        toast.success('Builder created');
      } else {
        await propertiesApi.updateBuilder(modal.id, form);
        toast.success('Builder updated');
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
      await propertiesApi.deleteBuilder(del.id);
      toast.success('Builder deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    }
  };

  const filtered = items.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && b.status) ||
      (statusFilter === 'inactive' && !b.status);
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((b) => b.status).length,
    projects: items.reduce((s, b) => s + Number(b.project_count || 0), 0),
    properties: items.reduce((s, b) => s + Number(b.property_count || 0), 0),
  }), [items]);

  const statusCounts = useMemo(() => ({
    active: items.filter((b) => b.status).length,
    inactive: items.filter((b) => !b.status).length,
  }), [items]);

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center shrink-0">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Builders</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage builder / developer partners</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openNew}>Add Builder</Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile icon={Briefcase} label="Total Builders" value={stats.total} grad="from-violet-500 to-indigo-500" delay="0ms" />
        <StatTile icon={Building2} label="Active" value={stats.active} grad="from-emerald-500 to-teal-500" delay="60ms" />
        <StatTile icon={FolderKanban} label="Projects" value={stats.projects} grad="from-cyan-500 to-sky-500" delay="120ms" />
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
                  active ? 'bg-violet-50 text-violet-600' : 'bg-slate-200/80 text-slate-500'
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
            placeholder="Search builders…"
            className="flex-1 min-w-[220px]"
          />
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
                  view === v.v ? 'bg-white text-violet-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || statusFilter) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          {view === 'table' ? (
            <TableSkeleton rows={6} cols={6} />
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
            title="No builders"
            message="Builder / developer partners appear here — they power property listings."
            action={
              (search || statusFilter) ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={openNew}>Add Builder</Button>
              )
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((b, i) => (
              <Card
                key={b.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-4">
                  {b.logo ? (
                    <img src={mediaUrl(b.logo)} alt={b.name} className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-md" />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0">
                      <span className="font-display font-extrabold text-white text-lg">{String(b.name || '?')[0].toUpperCase()}</span>
                    </div>
                  )}
                  <Badge tone={b.status ? 'emerald' : 'slate'} dot className="font-bold">
                    {b.status ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h3 className="relative font-display font-bold text-slate-900 text-lg">{b.name}</h3>
                {b.description && (
                  <p className="relative text-sm text-slate-500 mt-1 line-clamp-2">{b.description}</p>
                )}
                {b.website && (
                  <a
                    href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="relative inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 ring-1 ring-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-100 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" /> {b.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <div className="relative grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
                    <FolderKanban className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                    <p className="font-display font-extrabold text-slate-900 text-lg">{b.project_count ?? 0}</p>
                    <p className="text-[11px] text-slate-500">Projects</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
                    <Home className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <p className="font-display font-extrabold text-slate-900 text-lg">{b.property_count ?? 0}</p>
                    <p className="text-[11px] text-slate-500">Properties</p>
                  </div>
                </div>
                <div className="relative flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="secondary" icon={Pencil} className="flex-1" onClick={() => openEdit(b)}>Edit</Button>
                  <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDel(b)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Builder</TH>
                <TH className="hidden md:table-cell">Website</TH>
                <TH>Projects</TH>
                <TH>Properties</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <TRow key={b.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      {b.logo ? (
                        <img src={mediaUrl(b.logo)} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20 flex items-center justify-center shrink-0">
                          <span className="font-display font-extrabold text-white">{String(b.name || '?')[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[280px]">{b.description}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell">
                    {b.website ? (
                      <a
                        href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" /> {b.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </TD>
                  <TD><Badge tone="cyan" className="font-bold">{b.project_count ?? 0}</Badge></TD>
                  <TD><Badge tone="amber" className="font-bold">{b.property_count ?? 0}</Badge></TD>
                  <TD><Badge tone={b.status ? 'emerald' : 'slate'} dot>{b.status ? 'Active' : 'Inactive'}</Badge></TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel(b)}><Trash2 className="w-4 h-4" /></Button>
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
        title={modal === 'new' ? 'Add builder' : 'Edit builder'}
        subtitle={modal === 'new' ? 'New builder / developer partner' : modal?.name}
        icon={Briefcase}
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
          <Input
            label="Name" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Skyline Builders"
            icon={Building2}
          />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="skylinebuilders.in"
            icon={Globe}
          />
          <Input
            label="Contact phone"
            value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            placeholder="+91 98765 43210"
            icon={Phone}
          />
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete builder?" message={`${del?.name} will be removed.`} confirmText="Delete" />
    </>
  );
}

/* ---------- Local StatTile (lighter StatCard) ---------- */
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
