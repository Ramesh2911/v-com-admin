import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays, Plus, Pencil, Trash2, RotateCcw, SearchX,
  MapPin, Sparkles, Ticket, Building2, Clock,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { eventsAdminApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select, StatCard,
} from '../../components/ui';
import { fmtDate } from '../../lib/utils';

const istToday = () =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

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

const toList = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const fromList = (a) => (Array.isArray(a) ? a.join(', ') : '');

export default function Events() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // 'new' | event | null
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: '', organizer: '', category: '', event_date: '', start_time: '', time_range: '',
    location: '', venue_name: '', venue_address: '', banner_url: '', is_featured: 0,
    description: '', highlights: '', amenities: '', latitude: '', longitude: '',
    status: 1, sort_order: 0,
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = (e) => {
    if (e === 'new') {
      setForm({ ...emptyForm, event_date: istToday() });
    } else {
      setForm({
        title: e.title || '',
        organizer: e.organizer || '',
        category: e.category || '',
        event_date: e.event_date || '',
        start_time: e.start_time || '',
        time_range: e.time_range || '',
        location: e.location || '',
        venue_name: e.venue_name || '',
        venue_address: e.venue_address || '',
        banner_url: e.banner_url || '',
        is_featured: Number(e.is_featured) ? 1 : 0,
        description: e.description || '',
        highlights: fromList(e.highlights),
        amenities: fromList(e.amenities),
        latitude: e.latitude ?? '',
        longitude: e.longitude ?? '',
        status: Number(e.status),
        sort_order: Number(e.sort_order) || 0,
      });
    }
    setModal(e);
  };

  const load = useCallback(() => {
    setLoading(true);
    eventsAdminApi
      .list()
      .then((r) => setEvents(r.data.data || []))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.location.trim()) return toast.error('Location is required');
    if (!form.event_date) return toast.error('Event date is required');
    const payload = {
      title: form.title.trim(),
      organizer: form.organizer.trim() || null,
      category: form.category.trim() || null,
      event_date: form.event_date,
      start_time: form.start_time || null,
      time_range: form.time_range.trim() || null,
      location: form.location.trim(),
      venue_name: form.venue_name.trim() || null,
      venue_address: form.venue_address.trim() || null,
      banner_url: form.banner_url.trim() || null,
      is_featured: Number(form.is_featured) ? 1 : 0,
      description: form.description.trim() || null,
      highlights: toList(form.highlights),
      amenities: toList(form.amenities),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
      status: Number(form.status) ? 1 : 0,
      sort_order: Number(form.sort_order) || 0,
    };
    if (payload.latitude !== null && Number.isNaN(payload.latitude)) return toast.error('Latitude must be a number');
    if (payload.longitude !== null && Number.isNaN(payload.longitude)) return toast.error('Longitude must be a number');
    setSaving(true);
    try {
      if (modal === 'new') { await eventsAdminApi.create(payload); toast.success('Event created'); }
      else { await eventsAdminApi.update(modal.id, payload); toast.success('Event updated'); }
      setModal(null);
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await eventsAdminApi.remove(del.id);
      toast.success('Event deleted');
      setDel(null);
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const today = istToday();
  const upcoming = events.filter((e) => Number(e.status) && e.event_date >= today).length;
  const featured = events.filter((e) => Number(e.is_featured)).length;
  const hidden = events.filter((e) => !Number(e.status)).length;

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? events
    : events.filter((e) =>
        `${e.title} ${e.organizer || ''} ${e.location} ${e.category || ''}`.toLowerCase().includes(term));

  const columns = [
    {
      name: 'Event',
      selector: (r) => r.title,
      sortable: true,
      grow: 2,
      cell: (e) => (
        <div className="flex items-center gap-3 min-w-0">
          {e.banner_url ? (
            <img src={e.banner_url} alt="" className="h-10 w-16 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm shrink-0" />
          ) : (
            <span className="h-10 w-16 rounded-lg bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 shadow-md flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-white" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
              {e.title}
              {Number(e.is_featured) && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{e.organizer || e.category || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Date',
      selector: (r) => r.event_date,
      sortable: true,
      width: '190px',
      cell: (e) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800">{fmtDate(e.event_date)}</p>
          <p className="text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {e.time_range || e.start_time || '—'}
          </p>
        </div>
      ),
    },
    {
      name: 'Location',
      selector: (r) => r.location,
      sortable: true,
      width: '160px',
      cell: (e) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {e.location}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (r) => Number(r.status),
      sortable: true,
      width: '110px',
      cell: (e) => (Number(e.status)
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
      cell: (e) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openModal(e)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ id: e.id, name: e.title })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-500 shadow-lg shadow-sky-500/30 flex items-center justify-center shrink-0">
            <CalendarDays className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Events &amp; corporate exhibitions
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">Public directory events — shown in the customer app</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => openModal('new')}>Add Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CalendarDays} label="Events" value={events.length} tone="brand" delay="0ms" />
        <StatCard icon={Clock} label="Upcoming" value={upcoming} tone="cyan" delay="60ms" />
        <StatCard icon={Sparkles} label="Featured" value={featured} tone="amber" delay="120ms" />
        <StatCard icon={Building2} label="Hidden" value={hidden} tone="rose" delay="180ms" />
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
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">All events</h3>
                <p className="text-sm text-slate-500">{events.length} events · active ones appear in the app</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openModal('new')}>Add Event</Button>
          </div>
          {events.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No events yet"
              message="Create an event — set title, date and location to publish it to the app."
              action={<Button icon={Plus} onClick={() => openModal('new')}>Add Event</Button>}
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
                    {filtered.length} of {events.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Search events…" className="w-full sm:w-72" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No events match your search</p>
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

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Add event' : 'Edit event'}
        subtitle={modal === 'new' ? 'Published to the customer app when Active' : modal?.title}
        icon={CalendarDays}
        size="lg"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title" required value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Kolkata Tech Expo 2026" icon={CalendarDays}
            />
            <Input
              label="Location" required value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Kolkata" icon={MapPin}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Event date" required type="date" value={form.event_date}
              onChange={(e) => set('event_date', e.target.value)} icon={CalendarDays}
            />
            <Input
              label="Start time" type="time" value={form.start_time}
              onChange={(e) => set('start_time', e.target.value)} icon={Clock}
            />
            <Input
              label="Time range" value={form.time_range}
              onChange={(e) => set('time_range', e.target.value)}
              placeholder="10:00 - 18:00"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Organizer" value={form.organizer}
              onChange={(e) => set('organizer', e.target.value)}
              placeholder="e.g. NASSCOM" icon={Building2}
            />
            <Input
              label="Category" value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="e.g. Corporate"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Venue name" value={form.venue_name}
              onChange={(e) => set('venue_name', e.target.value)}
              placeholder="e.g. Biswa Bangla Melaan"
            />
            <Input
              label="Venue address" value={form.venue_address}
              onChange={(e) => set('venue_address', e.target.value)}
              placeholder="Full address"
            />
          </div>
          <Textarea
            label="Description" value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="About the event (optional)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Highlights" value={form.highlights}
              onChange={(e) => set('highlights', e.target.value)}
              placeholder="Keynote, Demo, Networking (comma-separated)"
            />
            <Input
              label="Amenities" value={form.amenities}
              onChange={(e) => set('amenities', e.target.value)}
              placeholder="Wi-Fi, Parking, Food (comma-separated)"
            />
          </div>
          <Input
            label="Banner image URL" value={form.banner_url}
            onChange={(e) => set('banner_url', e.target.value)}
            placeholder="https://… (optional)"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Latitude" value={form.latitude}
              onChange={(e) => set('latitude', e.target.value)}
              placeholder="22.5726"
            />
            <Input
              label="Longitude" value={form.longitude}
              onChange={(e) => set('longitude', e.target.value)}
              placeholder="88.3639"
            />
            <Select label="Featured" value={form.is_featured} onChange={(e) => set('is_featured', Number(e.target.value))}>
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => set('status', Number(e.target.value))}>
              <option value={1}>Active</option>
              <option value={0}>Hidden</option>
            </Select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={doDelete}
        title="Delete?"
        message={`${del?.name || 'This event'} will be permanently removed.`}
        confirmText="Delete"
      />
    </>
  );
}
