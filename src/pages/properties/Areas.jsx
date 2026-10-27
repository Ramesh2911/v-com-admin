import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, RotateCcw, SearchX, LayoutGrid, List,
  Building2, Home, Landmark, Navigation, FolderKanban,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Button, EmptyState,
  useToast, Modal, Input, ConfirmDialog, Badge, SearchInput, Select,
  TableSkeleton,
} from '../../components/ui';
import { cx } from '../../lib/utils';

export default function Areas() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [view, setView] = useState('grid');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', locality: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    propertiesApi.areas()
      .then((r) => setItems(r.data.data))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const openNew = () => { setForm({ name: '', locality: '', city: '' }); setModal('new'); };
  const openEdit = (a) => { setForm({ name: a.name, locality: a.locality || '', city: a.city }); setModal(a); };

  const save = async () => {
    if (!form.name || !form.city) return toast.error('Name and city are required');
    setSaving(true);
    try {
      if (modal === 'new') {
        await propertiesApi.createArea(form);
        toast.success('Area created');
      } else {
        await propertiesApi.updateArea(modal.id, form);
        toast.success('Area updated');
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
      await propertiesApi.deleteArea(del.id);
      toast.success('Area deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
    }
  };

  const cities = useMemo(
    () => [...new Set(items.map((a) => a.city).filter(Boolean))].sort(),
    [items]
  );

  const filtered = items.filter((a) => {
    const matchesSearch = `${a.name} ${a.locality} ${a.city}`.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !cityFilter || a.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const stats = useMemo(() => ({
    total: items.length,
    cities: cities.length,
    properties: items.reduce((s, a) => s + Number(a.property_count || 0), 0),
  }), [items, cities]);

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Areas / Localities</h1>
            <p className="text-sm text-slate-500 mt-0.5">Search areas used by the customer app</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openNew}>Add Area</Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatTile icon={MapPin} label="Total Areas" value={stats.total} grad="from-emerald-500 to-teal-500" delay="0ms" />
        <StatTile icon={Landmark} label="Cities" value={stats.cities} grad="from-cyan-500 to-sky-500" delay="60ms" />
        <StatTile icon={Home} label="Properties" value={stats.properties} grad="from-amber-500 to-orange-500" delay="120ms" />
      </div>

      {/* ============ Toolbar ============ */}
      <Card className="mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <CardBody className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search area, locality or city…"
            className="flex-1 min-w-[220px]"
          />
          <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-44">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  view === v.v ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || cityFilter) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setCityFilter(''); }}>Clear</Button>
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
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No areas"
            message="Areas and localities appear here — customers use them to search properties."
            action={
              (search || cityFilter) ? (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setCityFilter(''); }}>Clear filters</Button>
              ) : (
                <Button icon={Plus} onClick={openNew}>Add Area</Button>
              )
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((a, i) => (
            <Card
              key={a.id}
              hover
              className="relative overflow-hidden p-5 group animate-fade-up"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <Badge tone="cyan" className="font-bold">
                  <Landmark className="w-3 h-3" /> {a.city}
                </Badge>
              </div>
              <h3 className="relative font-display font-bold text-slate-900 text-lg mt-3">{a.name}</h3>
              {a.locality && (
                <p className="relative text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> {a.locality}
                </p>
              )}
              <div className="relative mt-4 rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3 text-center">
                <Home className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="font-display font-extrabold text-slate-900 text-lg">{a.property_count ?? 0}</p>
                <p className="text-[11px] text-slate-500">Properties</p>
              </div>
              <div className="relative flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <Button size="sm" variant="secondary" icon={Pencil} className="flex-1" onClick={() => openEdit(a)}>Edit</Button>
                <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDel(a)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Area</TH>
                <TH>Locality</TH>
                <TH>City</TH>
                <TH>Properties</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <TRow key={a.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-semibold text-slate-900">{a.name}</p>
                    </div>
                  </TD>
                  <TD className="text-sm">{a.locality || '—'}</TD>
                  <TD><Badge tone="cyan" className="font-bold"><Landmark className="w-3 h-3" /> {a.city}</Badge></TD>
                  <TD><Badge tone="amber" className="font-bold">{a.property_count ?? 0}</Badge></TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel(a)}><Trash2 className="w-4 h-4" /></Button>
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
        title={modal === 'new' ? 'Add area' : 'Edit area'}
        subtitle={modal === 'new' ? 'New area / locality for property search' : `${modal?.name}, ${modal?.city}`}
        icon={MapPin}
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
            label="Area name" required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Whitefield"
            icon={MapPin}
          />
          <Input
            label="Locality / zone"
            value={form.locality}
            onChange={(e) => setForm({ ...form, locality: e.target.value })}
            placeholder="Bangalore East"
            icon={Navigation}
          />
          <Input
            label="City" required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Bangalore"
            icon={Landmark}
          />
          <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-3 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              Areas power the customer app's <b>locality search</b> — properties linked to this area become searchable by this name and city.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete area?" message={`${del?.name} will be removed.`} confirmText="Delete" />
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
