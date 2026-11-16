import { useCallback, useEffect, useState } from 'react';
import {
  Image as ImageIcon, Plus, Pencil, Trash2, RotateCcw, SearchX,
  CalendarDays, ImagePlus, Eye, Clock, Hash, GalleryHorizontalEnd,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { bannersApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select,
  StatCard,
} from '../../components/ui';
import { fmtDate } from '../../lib/utils';

function ImagePicker({ preview, onChange, onRemove, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Banner image {required ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal">· optional</span>}
      </label>
      <div className="flex items-start gap-3">
        <label className="group h-28 w-40 shrink-0 rounded-xl border-2 border-dashed border-slate-300 hover:border-fuchsia-400 hover:bg-fuchsia-50/50 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 transition-colors">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-fuchsia-500 transition-colors">
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] font-bold">Upload</span>
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
        <div className="pt-1 min-w-0">
          <p className="text-xs text-slate-500">JPG / PNG / WEBP · max 10MB</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Home carousel · <span className="font-mono">slot 1 = first shown</span></p>
          <p className="text-[11px] text-slate-400 mt-0.5">Stored in Cloudinary</p>
          {preview && (
            <button
              type="button"
              onClick={onRemove}
              className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              Remove image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const effStatus = (r) => {
  if (!Number(r.status)) return 'inactive';
  const now = Date.now();
  if (r.starts_at && new Date(r.starts_at).getTime() > now) return 'scheduled';
  if (r.ends_at && new Date(r.ends_at).getTime() < now) return 'expired';
  return 'active';
};

const STATUS_META = {
  active: { tone: 'emerald', label: 'Live' },
  scheduled: { tone: 'sky', label: 'Scheduled' },
  expired: { tone: 'rose', label: 'Expired' },
  inactive: { tone: 'slate', label: 'Hidden' },
};

const windowText = (r) => {
  if (!r.starts_at && !r.ends_at) return 'Always on';
  if (r.starts_at && r.ends_at) return `${fmtDate(r.starts_at)} – ${fmtDate(r.ends_at)}`;
  if (r.ends_at) return `Until ${fmtDate(r.ends_at)}`;
  return `From ${fmtDate(r.starts_at)}`;
};

const toLocalInput = (dt) => {
  if (!dt) return '';
  const s = String(dt).replace(' ', 'T');
  return s.length >= 16 ? s.slice(0, 16) : '';
};

const tableStyles = {
  headCells: {
    style: {
      fontSize: '11px',
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#64748b',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      minHeight: '44px',
    },
  },
  cells: {
    style: {
      fontSize: '14px',
      paddingTop: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid #f1f5f9',
      color: '#0f172a',
    },
  },
  rows: {
    style: {
      minHeight: '64px',
      '&:hover': { backgroundColor: 'rgba(217,70,239,0.05)' },
    },
  },
  table: { style: { fontFamily: 'inherit' } },
};

export default function Banners() {
  const toast = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // 'new' | banner | null
  const [del, setDel] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { title: '', subtitle: '', slot: '', starts_at: '', ends_at: '', status: 1 };
  const [form, setForm] = useState(emptyForm);

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImage(f);
    setImagePreview(URL.createObjectURL(f));
  };
  const clearImage = () => {
    setImagePreview((p) => {
      if (p && p.startsWith('blob:')) URL.revokeObjectURL(p);
      return null;
    });
    setImage(null);
  };
  const closeModal = () => {
    clearImage();
    setModal(null);
  };

  const openModal = (b) => {
    if (b === 'new') {
      setForm({ ...emptyForm, slot: String(nextSlot()) });
      setImage(null);
      setImagePreview(null);
    } else {
      setForm({
        title: b.title,
        subtitle: b.subtitle || '',
        slot: String(b.slot),
        starts_at: toLocalInput(b.starts_at),
        ends_at: toLocalInput(b.ends_at),
        status: Number(b.status),
      });
      setImage(null);
      setImagePreview(b.image || null);
    }
    setModal(b);
  };

  const nextSlot = () => {
    const max = banners.reduce((m, b) => Math.max(m, Number(b.slot) || 0), 0);
    return Math.min(max + 1, 99);
  };

  const load = useCallback(() => {
    setLoading(true);
    bannersApi
      .list()
      .then((r) => setBanners(r.data.data))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (modal === 'new' && !image) return toast.error('Banner image is required');
    const slot = Number(form.slot);
    if (!Number.isInteger(slot) || slot < 1 || slot > 99) {
      return toast.error('Slot must be a number between 1 and 99');
    }
    if (form.starts_at && form.ends_at && form.starts_at >= form.ends_at) {
      return toast.error('Start must be before end');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('subtitle', form.subtitle.trim());
      fd.append('slot', String(slot));
      fd.append('starts_at', form.starts_at || '');
      fd.append('ends_at', form.ends_at || '');
      fd.append('status', String(form.status));
      if (image) fd.append('image', image);
      if (modal === 'new') { await bannersApi.create(fd); toast.success('Banner created'); }
      else { await bannersApi.update(modal.id, fd); toast.success('Banner updated'); }
      closeModal();
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await bannersApi.remove(del.id);
      toast.success('Deleted');
      setDel(null);
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const liveCount = banners.filter((b) => effStatus(b) === 'active').length;
  const scheduledCount = banners.filter((b) => effStatus(b) === 'scheduled').length;
  const hiddenCount = banners.filter((b) => effStatus(b) !== 'active' && effStatus(b) !== 'scheduled').length;

  const term = q.trim().toLowerCase();
  const filtered = !term
    ? banners
    : banners.filter((b) => `${b.title} ${b.subtitle || ''}`.toLowerCase().includes(term));

  const statusCell = (r) => {
    const m = STATUS_META[effStatus(r)];
    return <Badge tone={m.tone} dot className="font-bold">{m.label}</Badge>;
  };

  const columns = [
    {
      name: 'Banner',
      selector: (r) => r.title,
      sortable: true,
      grow: 2,
      cell: (b) => (
        <div className="flex items-center gap-3">
          {b.image ? (
            <img src={b.image} alt="" className="h-10 w-16 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm shrink-0" />
          ) : (
            <span className="h-10 w-16 rounded-lg bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 shadow-md flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-white" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{b.title}</p>
            <p className="text-xs text-slate-500 truncate max-w-[300px]">{b.subtitle || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Slot',
      selector: (r) => Number(r.slot),
      sortable: true,
      width: '90px',
      cell: (b) => (
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-bold text-fuchsia-300 ring-1 ring-slate-700">
          <Hash className="w-3 h-3" /> {b.slot}
        </span>
      ),
    },
    {
      name: 'Window',
      selector: (r) => r.starts_at || r.ends_at || '',
      sortable: true,
      width: '220px',
      cell: (b) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {windowText(b)}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (r) => effStatus(r),
      sortable: true,
      width: '120px',
      cell: statusCell,
    },
    {
      name: '',
      right: true,
      width: '110px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openModal(b)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ id: b.id, name: b.title })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 shadow-lg shadow-fuchsia-500/30 flex items-center justify-center shrink-0">
            <ImageIcon className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wider flex items-center gap-1.5">
              <GalleryHorizontalEnd className="w-3 h-3" /> Home carousel
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Banners</h1>
            <p className="text-sm text-slate-500 mt-0.5">App home top banners — image, title &amp; slot order (1 = first shown)</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ImageIcon} label="Banners" value={banners.length} tone="brand" delay="0ms" />
        <StatCard icon={Eye} label="Live now" value={liveCount} tone="emerald" delay="60ms" />
        <StatCard icon={Clock} label="Scheduled" value={scheduledCount} tone="cyan" delay="120ms" />
        <StatCard icon={Trash2} label="Hidden / ended" value={hiddenCount} tone="amber" delay="180ms" />
      </div>

      {/* ============ Content ============ */}
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/25 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Carousel banners</h3>
                <p className="text-sm text-slate-500">{banners.length} banners · shown in app home by slot order</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openModal('new')}>Add Banner</Button>
          </div>
          {banners.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No banners yet"
              message="Create a home banner — upload an image, set title and slot position."
              action={<Button icon={Plus} onClick={() => openModal('new')}>Add Banner</Button>}
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
                    {filtered.length} of {banners.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Search banners…" className="w-full sm:w-72" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No banners match your search</p>
                  <button type="button" onClick={() => setQ('')} className="mt-1 text-xs font-bold text-fuchsia-600 hover:underline">
                    Clear search
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      {/* ============ Form modal ============ */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'new' ? 'Add banner' : 'Edit banner'}
        subtitle={modal === 'new' ? 'Image + title shown on app home' : modal?.title}
        icon={ImageIcon}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={modal === 'new' ? Plus : Pencil}>
              {modal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ImagePicker
            required={modal === 'new'}
            preview={imagePreview}
            onChange={pickImage}
            onRemove={clearImage}
          />
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Monsoon Sale — 30% off"
            icon={ImageIcon}
          />
          <Textarea
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Short line shown under the title (optional)"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Slot (position)"
              required
              type="number"
              min="1"
              max="99"
              value={form.slot}
              onChange={(e) => setForm({ ...form, slot: e.target.value })}
              placeholder="1"
              icon={Hash}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: Number(e.target.value) })}
            >
              <option value={1}>Active</option>
              <option value={0}>Hidden</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              icon={CalendarDays}
            />
            <Input
              label="Ends"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              icon={CalendarDays}
            />
          </div>
          <p className="text-[11px] text-slate-400 -mt-2">
            Leave dates empty for always-on. Slot 1 shows first in the app home carousel.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={doDelete}
        title="Delete?"
        message={`${del?.name || 'This banner'} will be permanently removed.`}
        confirmText="Delete"
      />
    </>
  );
}
