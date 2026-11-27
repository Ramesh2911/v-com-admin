import { useCallback, useEffect, useState } from 'react';
import {
  Hotel, Plus, Pencil, Trash2, RotateCcw, SearchX,
  MapPin, Star, BedDouble, Ticket,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { hotelApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select, StatCard,
} from '../../components/ui';
import { fmtDate } from '../../lib/utils';

const tableStyles = {
  headCells: {
    style: {
      fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: '#64748b', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', minHeight: '44px',
    },
  },
  cells: {
    style: { fontSize: '14px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', color: '#0f172a' },
  },
  rows: { style: { minHeight: '64px', '&:hover': { backgroundColor: 'rgba(56,189,248,0.05)' } } },
  table: { style: { fontFamily: 'inherit' } },
};

const CATEGORIES = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'resorts', label: 'Resorts' },
  { id: 'villas', label: 'Villas & Private Stays' },
  { id: 'boutique_heritage', label: 'Boutique & Heritage' },
];
const STARS = ['3-Star', '4-Star', '5-Star', 'Luxury'];

export default function Hotels() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: '', star_rating: '4-Star', category_id: 'hotels', property_type: '',
    location: '', city: '', description: '', main_image: '',
    amenities: '', key_amenities: '',
    check_in_time: '02:00 PM', check_out_time: '11:00 AM',
    cancellation_policy: '', status: 'active',
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = (p) => {
    if (p === 'new') {
      setForm({ ...emptyForm });
    } else {
      setForm({
        name: p.name || '',
        star_rating: p.star_rating || '4-Star',
        category_id: p.category_id || 'hotels',
        property_type: p.property_type || '',
        location: p.location || '',
        city: p.city || '',
        description: p.description || '',
        main_image: p.main_image || '',
        amenities: Array.isArray(p.amenities) ? p.amenities.join(', ') : '',
        key_amenities: Array.isArray(p.key_amenities) ? p.key_amenities.join(', ') : '',
        check_in_time: p.check_in_time || '02:00 PM',
        check_out_time: p.check_out_time || '11:00 AM',
        cancellation_policy: p.cancellation_policy || '',
        status: p.status || 'active',
      });
    }
    setModal(p);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      hotelApi.stats().catch(() => null),
      hotelApi.properties({ page: 1, limit: 100 }).catch(() => null),
    ])
      .then(([s, r]) => {
        if (s) setStats(s.data.data);
        if (r) setItems(r.data.data?.items || []);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const save = async () => {
    if (!form.name.trim()) return toast.error('Property name is required');
    if (!form.location.trim()) return toast.error('Location is required');
    if (!form.city.trim()) return toast.error('City is required');
    const payload = {
      name: form.name.trim(),
      star_rating: form.star_rating,
      category_id: form.category_id,
      property_type: form.property_type.trim() || null,
      location: form.location.trim(),
      city: form.city.trim(),
      description: form.description.trim() || null,
      main_image: form.main_image.trim() || null,
      amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      key_amenities: form.key_amenities.split(',').map((s) => s.trim()).filter(Boolean),
      check_in_time: form.check_in_time || '02:00 PM',
      check_out_time: form.check_out_time || '11:00 AM',
      cancellation_policy: form.cancellation_policy.trim() || null,
      status: form.status,
    };
    setSaving(true);
    try {
      if (modal && modal !== 'new') {
        await hotelApi.updateProperty(modal.id, payload);
        toast.success('Property updated');
      } else {
        await hotelApi.createProperty(payload);
        toast.success('Property created');
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
      await hotelApi.deleteProperty(del.id);
      toast.success('Property deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
      setDel(null);
    }
  };

  const filtered = items.filter((p) => {
    const s = q.toLowerCase();
    return !q || (p.name || '').toLowerCase().includes(s) || (p.city || '').toLowerCase().includes(s) || (p.location || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      name: 'Property',
      selector: (r) => r.name,
      sortable: true,
      minWidth: '260px',
      cell: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          {p.main_image ? (
            <img src={p.main_image} alt="" className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" />
          ) : (
            <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center shrink-0">
              <Hotel className="w-5 h-5 text-white" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{p.name}</p>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {p.location}
            </p>
          </div>
        </div>
      ),
    },
    {
      name: 'Category',
      selector: (r) => r.category_id,
      sortable: true,
      width: '150px',
      cell: (p) => <Badge tone="sky">{CATEGORIES.find((c) => c.id === p.category_id)?.label || p.category_id}</Badge>,
    },
    {
      name: 'Stars',
      selector: (r) => r.star_rating,
      sortable: true,
      width: '110px',
      cell: (p) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {p.star_rating}
        </span>
      ),
    },
    {
      name: 'Rating',
      selector: (r) => Number(r.guest_rating) || 0,
      sortable: true,
      width: '120px',
      cell: (p) => (
        <span className="text-xs font-semibold text-slate-600">
          {Number(p.guest_rating || 0).toFixed(1)} ★ ({Number(p.reviews_count || 0)})
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '110px',
      cell: (p) => (p.status === 'active'
        ? <Badge tone="emerald" dot className="font-bold">Active</Badge>
        : <Badge tone="slate" dot className="font-bold">Hidden</Badge>),
    },
    {
      name: '',
      right: true,
      width: '110px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openModal(p)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ id: p.id, name: p.name })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 shadow-lg shadow-sky-500/30 flex items-center justify-center shrink-0">
            <Hotel className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> V-COM BOOKINGS — Discover. Stay. Experience.
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Hotels & Stays</h1>
            <p className="text-sm text-slate-500 mt-0.5">Hotels, resorts, villas & boutique properties</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => openModal('new')}>Add Property</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Hotel} label="Properties" value={stats?.total_properties ?? '—'} tone="brand" delay="0ms" />
        <StatCard icon={BedDouble} label="Rooms" value={stats?.total_rooms ?? '—'} tone="cyan" delay="60ms" />
        <StatCard icon={Star} label="Avg rating" value={stats?.avg_rating ?? '—'} tone="amber" delay="120ms" />
        <StatCard icon={MapPin} label="Active" value={stats?.active_properties ?? '—'} tone="emerald" delay="180ms" />
      </div>

      {loading ? (
        <Card className="animate-fade-up">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 shadow-lg shadow-sky-500/25 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">All properties</h3>
                <p className="text-sm text-slate-500">{items.length} properties</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openModal('new')}>Add Property</Button>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No properties yet"
              message="Create a property — set name, city and category to publish it."
              action={<Button icon={Plus} onClick={() => openModal('new')}>Add Property</Button>}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {filtered.length} of {items.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Search properties…" className="w-full sm:w-72" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No properties match your search</p>
                  <button type="button" onClick={() => setQ('')} className="mt-1 text-xs font-bold text-sky-600 hover:underline">
                    Clear search
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal && modal !== 'new' ? 'Edit property' : 'New property'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Property name *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ocean View Resort" />
            <Input label="Property type" value={form.property_type} onChange={(e) => set('property_type', e.target.value)} placeholder="Beachfront Luxury Resort" />
            <Select label="Category" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
            <Select label="Star rating" value={form.star_rating} onChange={(e) => set('star_rating', e.target.value)}>
              {STARS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Location *" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Panambur Beach Road" />
            <Input label="City *" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mangalore" />
            <Input label="Check-in time" value={form.check_in_time} onChange={(e) => set('check_in_time', e.target.value)} placeholder="02:00 PM" />
            <Input label="Check-out time" value={form.check_out_time} onChange={(e) => set('check_out_time', e.target.value)} placeholder="11:00 AM" />
            <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
            </Select>
          </div>
          <Input label="Main image URL" value={form.main_image} onChange={(e) => set('main_image', e.target.value)} placeholder="https://…" />
          <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          <Input label="Key amenities (comma separated)" value={form.key_amenities} onChange={(e) => set('key_amenities', e.target.value)} placeholder="Swimming Pool, Free Wi-Fi, Private Beach" />
          <Input label="All amenities (comma separated)" value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="Swimming Pool, Spa, Gym, Restaurant" />
          <Textarea label="Cancellation policy" value={form.cancellation_policy} onChange={(e) => set('cancellation_policy', e.target.value)} rows={2} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{modal && modal !== 'new' ? 'Save changes' : 'Create property'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        title="Delete property?"
        message={`"${del?.name}" and its rooms will be permanently removed. Properties with reservations cannot be deleted.`}
        confirmText="Delete"
        tone="danger"
      />
    </>
  );
}
