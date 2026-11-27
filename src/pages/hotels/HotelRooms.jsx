import { useCallback, useEffect, useState } from 'react';
import {
  BedDouble, Plus, Pencil, Trash2, RotateCcw, SearchX, Hotel, Ticket,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { hotelApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, ConfirmDialog, Badge, Select, StatCard,
} from '../../components/ui';

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
  rows: { style: { minHeight: '60px', '&:hover': { backgroundColor: 'rgba(56,189,248,0.05)' } } },
  table: { style: { fontFamily: 'inherit' } },
};

const inr = (n) => (n == null || n === '' ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export default function HotelRooms() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [propFilter, setPropFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    property_id: '', room_name: '', bed_type: '', room_size: '', view: '',
    max_adults: 2, max_children: 0, available_rooms: 1,
    ep_rate: '', cp_rate: '', map_rate: '', ap_rate: '', image_url: '', status: 'active',
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = (r) => {
    if (r === 'new') {
      setForm({ ...emptyForm, property_id: propFilter || (properties[0]?.id ?? '') });
    } else {
      setForm({
        property_id: r.property_id || '',
        room_name: r.room_name || '',
        bed_type: r.bed_type || '',
        room_size: r.room_size || '',
        view: r.view || '',
        max_adults: Number(r.max_adults) || 2,
        max_children: Number(r.max_children) || 0,
        available_rooms: Number(r.available_rooms) || 1,
        ep_rate: r.ep_rate ?? '',
        cp_rate: r.cp_rate ?? '',
        map_rate: r.map_rate ?? '',
        ap_rate: r.ap_rate ?? '',
        image_url: r.image_url || '',
        status: r.status || 'active',
      });
    }
    setModal(r);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      hotelApi.stats().catch(() => null),
      hotelApi.rooms({ page: 1, limit: 100 }).catch(() => null),
      hotelApi.properties({ page: 1, limit: 100 }).catch(() => null),
    ])
      .then(([s, r, p]) => {
        if (s) setStats(s.data.data);
        if (r) setRooms(r.data.data?.items || []);
        if (p) setProperties(p.data.data?.items || []);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const save = async () => {
    if (!form.property_id) return toast.error('Select a property');
    if (!form.room_name.trim()) return toast.error('Room name is required');
    if (form.ep_rate === '' || Number(form.ep_rate) <= 0) return toast.error('EP rate must be > 0');
    const num = (v) => (v === '' || v == null ? null : Number(v));
    const payload = {
      property_id: form.property_id,
      room_name: form.room_name.trim(),
      bed_type: form.bed_type.trim() || null,
      room_size: form.room_size.trim() || null,
      view: form.view.trim() || null,
      max_adults: Number(form.max_adults) || 2,
      max_children: Number(form.max_children) || 0,
      available_rooms: Number(form.available_rooms) || 1,
      ep_rate: Number(form.ep_rate),
      cp_rate: num(form.cp_rate),
      map_rate: num(form.map_rate),
      ap_rate: num(form.ap_rate),
      image_url: form.image_url.trim() || null,
      status: form.status,
    };
    setSaving(true);
    try {
      if (modal && modal !== 'new') {
        await hotelApi.updateRoom(modal.id, payload);
        toast.success('Room updated');
      } else {
        await hotelApi.createRoom(payload);
        toast.success('Room created');
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
      await hotelApi.deleteRoom(del.id);
      toast.success('Room deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
      setDel(null);
    }
  };

  const filtered = rooms.filter((r) => {
    if (propFilter && r.property_id !== propFilter) return false;
    const s = q.toLowerCase();
    return !q || (r.room_name || '').toLowerCase().includes(s) || (r.property_name || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      name: 'Room',
      selector: (r) => r.room_name,
      sortable: true,
      minWidth: '220px',
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{r.room_name}</p>
          <p className="text-xs text-slate-500 truncate">{r.bed_type || '—'}{r.room_size ? ` · ${r.room_size}` : ''}{r.view ? ` · ${r.view}` : ''}</p>
        </div>
      ),
    },
    {
      name: 'Property',
      selector: (r) => r.property_name,
      sortable: true,
      minWidth: '180px',
      cell: (r) => (
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Hotel className="w-3.5 h-3.5 text-sky-500" /> {r.property_name}
        </span>
      ),
    },
    {
      name: 'EP / CP',
      selector: (r) => Number(r.ep_rate) || 0,
      sortable: true,
      width: '140px',
      cell: (r) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{inr(r.ep_rate)}</p>
          <p className="text-slate-500">CP {inr(r.cp_rate)}</p>
        </div>
      ),
    },
    {
      name: 'MAP / AP',
      width: '140px',
      cell: (r) => (
        <div className="text-xs">
          <p className="text-slate-600">MAP {inr(r.map_rate)}</p>
          <p className="text-slate-600">AP {inr(r.ap_rate)}</p>
        </div>
      ),
    },
    {
      name: 'Available',
      selector: (r) => Number(r.available_rooms) || 0,
      sortable: true,
      width: '110px',
      cell: (r) => <Badge tone="cyan">{r.available_rooms} left</Badge>,
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '100px',
      cell: (r) => (r.status === 'active'
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
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openModal(r)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ id: r.id, name: r.room_name })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 shadow-lg shadow-teal-500/30 flex items-center justify-center shrink-0">
            <BedDouble className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Room categories & meal-plan tariffs
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Hotel Rooms</h1>
            <p className="text-sm text-slate-500 mt-0.5">EP, CP, MAP & AP rates per room category</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => openModal('new')}>Add Room</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BedDouble} label="Total rooms" value={stats?.total_rooms ?? '—'} tone="brand" delay="0ms" />
        <StatCard icon={Hotel} label="Active rooms" value={stats?.active_rooms ?? '—'} tone="emerald" delay="60ms" />
        <StatCard icon={BedDouble} label="Properties" value={stats?.total_properties ?? '—'} tone="cyan" delay="120ms" />
        <StatCard icon={Ticket} label="Avg rating" value={stats?.avg_rating ?? '—'} tone="amber" delay="180ms" />
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 shadow-lg shadow-teal-500/25 flex items-center justify-center">
                <BedDouble className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">All rooms</h3>
                <p className="text-sm text-slate-500">{filtered.length} room categories</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openModal('new')}>Add Room</Button>
          </div>
          {rooms.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No rooms yet"
              message="Add a room category with EP rate to start accepting bookings."
              action={<Button icon={Plus} onClick={() => openModal('new')}>Add Room</Button>}
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
                    {filtered.length} of {rooms.length} shown
                  </p>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Select value={propFilter} onChange={(e) => setPropFilter(e.target.value)} className="w-full sm:w-56">
                      <option value="">All properties</option>
                      {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                    <SearchInput value={q} onChange={setQ} placeholder="Search rooms…" className="w-full sm:w-56" />
                  </div>
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No rooms match your filters</p>
                  <button type="button" onClick={() => { setQ(''); setPropFilter(''); }} className="mt-1 text-xs font-bold text-sky-600 hover:underline">
                    Clear filters
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal && modal !== 'new' ? 'Edit room' : 'New room'}>
        <div className="space-y-4">
          <Select label="Property *" value={form.property_id} onChange={(e) => set('property_id', e.target.value)}>
            <option value="">Select property…</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Room name *" value={form.room_name} onChange={(e) => set('room_name', e.target.value)} placeholder="Deluxe Sea View Room" />
            <Input label="Bed type" value={form.bed_type} onChange={(e) => set('bed_type', e.target.value)} placeholder="1 King Bed" />
            <Input label="Room size" value={form.room_size} onChange={(e) => set('room_size', e.target.value)} placeholder="420 sq. ft." />
            <Input label="View" value={form.view} onChange={(e) => set('view', e.target.value)} placeholder="Ocean View" />
            <Input label="Max adults" type="number" value={form.max_adults} onChange={(e) => set('max_adults', e.target.value)} />
            <Input label="Max children" type="number" value={form.max_children} onChange={(e) => set('max_children', e.target.value)} />
            <Input label="Available rooms" type="number" value={form.available_rooms} onChange={(e) => set('available_rooms', e.target.value)} />
            <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
            </Select>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Meal-plan tariffs (per night)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="EP ₹ *" type="number" value={form.ep_rate} onChange={(e) => set('ep_rate', e.target.value)} placeholder="6999" />
            <Input label="CP ₹" type="number" value={form.cp_rate} onChange={(e) => set('cp_rate', e.target.value)} placeholder="7699" />
            <Input label="MAP ₹" type="number" value={form.map_rate} onChange={(e) => set('map_rate', e.target.value)} placeholder="8999" />
            <Input label="AP ₹" type="number" value={form.ap_rate} onChange={(e) => set('ap_rate', e.target.value)} placeholder="10499" />
          </div>
          <Input label="Image URL" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{modal && modal !== 'new' ? 'Save changes' : 'Create room'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        title="Delete room?"
        message={`"${del?.name}" will be permanently removed. Rooms with reservations cannot be deleted.`}
        confirmText="Delete"
        tone="danger"
      />
    </>
  );
}
