import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, MapPin, Building2, IndianRupee, Camera,
  Eye, Star, UploadCloud, Compass, Home,
  Ruler, BedDouble, Bath, LandPlot,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardHeader, CardBody, Button, Input, Select, Textarea, PageLoader,
  useToast, FileDrop, Badge, StatusBadge,
} from '../../components/ui';
import { mediaUrl, cx } from '../../lib/utils';

const EMPTY = {
  builder_id: '', project_id: '', area_id: '', title: '', description: '',
  listing_type: 'sale', property_type: 'flat', area_sqft: '', facing: '', floor: '',
  total_floors: '', total_amount: '', rate_per_sqft: '', bedrooms: '', bathrooms: '',
  address: '', status: 'available', is_featured: 0,
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', tone: 'slate' },
  { value: 'available', label: 'Available', tone: 'emerald' },
  { value: 'sold', label: 'Sold', tone: 'rose' },
  { value: 'rented', label: 'Rented', tone: 'violet' },
  { value: 'inactive', label: 'Inactive', tone: 'slate' },
];

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = !!id;

  const [form, setForm] = useState(EMPTY);
  const [builders, setBuilders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([propertiesApi.builders(), propertiesApi.projects(), propertiesApi.areas()])
      .then(([b, p, a]) => {
        setBuilders(b.data.data);
        setProjects(p.data.data);
        setAreas(a.data.data);
      })
      .catch((err) => toast.error(getError(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editing) return;
    propertiesApi
      .get(id)
      .then((res) => {
        const p = res.data.data;
        setForm({
          builder_id: p.builder_id || '', project_id: p.project_id || '', area_id: p.area_id || '',
          title: p.title || '', description: p.description || '', listing_type: p.listing_type,
          property_type: p.property_type, area_sqft: p.area_sqft || '', facing: p.facing || '',
          floor: p.floor || '', total_floors: p.total_floors || '', total_amount: p.total_amount || '',
          rate_per_sqft: p.rate_per_sqft || '', bedrooms: p.bedrooms || '', bathrooms: p.bathrooms || '',
          address: p.address || '', status: p.status, is_featured: Number(p.is_featured) || 0,
        });
        setExistingMedia(p.media || []);
      })
      .catch((err) => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProjects = projects.filter((p) => !form.builder_id || p.builder_id === Number(form.builder_id));

  const mediaCount = existingMedia.length + files.length;

  const submit = async () => {
    if (!form.builder_id || !form.area_id || !form.title || !form.total_amount) {
      return toast.error('Builder, area, title and amount are required');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v != null) fd.append(k, v);
      });
      files.forEach((f) => fd.append('media', f));

      if (editing) {
        await propertiesApi.update(id, fd);
        toast.success('Property updated');
      } else {
        await propertiesApi.create(fd);
        toast.success('Property listed successfully — now visible in search results');
      }
      navigate('/properties');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = async (mediaId) => {
    try {
      await propertiesApi.removeMedia(mediaId);
      setExistingMedia((m) => m.filter((x) => x.id !== mediaId));
      toast.success('Media removed');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  if (loading) return <PageLoader label="Loading property…" />;

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" onClick={() => navigate('/properties')} aria-label="Back to properties">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center shrink-0">
            {editing ? <Save className="w-7 h-7 text-white" /> : <Building2 className="w-7 h-7 text-white" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
              <LandPlot className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {editing ? 'Edit Property' : 'Add New Property'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {editing ? 'Update listing details and media' : 'Fill details, upload media (max 15 photos/videos) and publish'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/properties')}>Back</Button>
          <Button icon={Save} loading={saving} onClick={submit}>{editing ? 'Save changes' : 'Submit Property'}</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ Main form ============ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1 · Location & classification */}
          <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <div className="px-5 pt-5 pb-1 flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  Location &amp; classification
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 rounded-md px-1.5 py-0.5">STEP 1</span>
                </h3>
                <p className="text-sm text-slate-500">Select builder, project and area — these power app search filters</p>
              </div>
            </div>
            <CardBody className="grid sm:grid-cols-2 gap-4">
              <Select label="Builder" required value={form.builder_id} onChange={(e) => set('builder_id', e.target.value)}>
                <option value="">Select builder…</option>
                {builders.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Project" value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
                <option value="">Select project…</option>
                {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Select label="Area / Locality" required value={form.area_id} onChange={(e) => set('area_id', e.target.value)}>
                <option value="">Select area…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.city}</option>)}
              </Select>
              <Select label="Sale or Rent?" required value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </Select>
              <Input label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Premium 3 BHK with clubhouse" className="sm:col-span-2" icon={Home} />
              <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} className="sm:col-span-2" rows={4} />
              <Input label="Full address" value={form.address} onChange={(e) => set('address', e.target.value)} className="sm:col-span-2" icon={MapPin} />
            </CardBody>
          </Card>

          {/* 2 · Property details */}
          <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="px-5 pt-5 pb-1 flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center shrink-0">
                <Ruler className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  Property details
                  <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 ring-1 ring-cyan-200 rounded-md px-1.5 py-0.5">STEP 2</span>
                </h3>
                <p className="text-sm text-slate-500">Area, facing, floor, amount and rate per sq.ft</p>
              </div>
            </div>
            <CardBody className="grid sm:grid-cols-3 gap-4">
              <Select label="Property type" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
                {['flat', 'apartment', 'villa', 'plot', 'commercial', 'office', 'shop', 'warehouse'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Input label="Area (Sq. Ft.)" type="number" value={form.area_sqft} onChange={(e) => set('area_sqft', e.target.value)} icon={Ruler} />
              <Select label="Facing" value={form.facing} onChange={(e) => set('facing', e.target.value)}>
                <option value="">Select…</option>
                {['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <Input label="Floor" type="number" value={form.floor} onChange={(e) => set('floor', e.target.value)} />
              <Input label="Total floors" type="number" value={form.total_floors} onChange={(e) => set('total_floors', e.target.value)} />
              <Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} icon={BedDouble} />
              <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} icon={Bath} />
              <Input label="Total amount (₹)" required type="number" value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} icon={IndianRupee} />
              <Input label="Rate per sq.ft (₹)" type="number" value={form.rate_per_sqft} onChange={(e) => set('rate_per_sqft', e.target.value)}
                hint="Auto-usable by apps for comparison" icon={IndianRupee} />
            </CardBody>
          </Card>

          {/* 3 · Media */}
          <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="px-5 pt-5 pb-1 flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  Upload photos &amp; videos
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 ring-1 ring-amber-200 rounded-md px-1.5 py-0.5">STEP 3</span>
                </h3>
                <p className="text-sm text-slate-500">Maximum 15 media files (photos or videos)</p>
              </div>
            </div>
            <CardBody>
              <FileDrop files={files} onFiles={setFiles} max={15} hint="JPG, PNG, MP4 · up to 15 files, 50MB each" />
              {existingMedia.length > 0 && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <UploadCloud className="w-3.5 h-3.5" /> Existing media ({existingMedia.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {existingMedia.map((m) => (
                      <div key={m.id} className="relative group rounded-xl overflow-hidden ring-1 ring-slate-200 aspect-square">
                        {m.type === 'image' ? (
                          <img src={mediaUrl(m.url)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        ) : (
                          <video src={mediaUrl(m.url)} className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => removeMedia(m.id)}
                          className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition text-xs font-bold flex items-center justify-center"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ============ Sidebar ============ */}
        <div className="space-y-6">
          {/* Publishing */}
          <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <CardHeader title="Publishing" icon={Eye} />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl">
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set('status', o.value)}
                      className={cx(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                        form.status === o.value
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={Number(form.is_featured) === 1}
                  onChange={(e) => set('is_featured', e.target.checked ? 1 : 0)}
                  className="h-5 w-5 rounded-lg border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                    <Star className={cx('w-3.5 h-3.5', Number(form.is_featured) === 1 ? 'text-amber-400 fill-current' : 'text-slate-300')} />
                    Featured listing
                  </p>
                  <p className="text-xs text-slate-500">Shown first in app search results</p>
                </div>
              </label>
              <div className="rounded-xl bg-brand-50 ring-1 ring-brand-100 p-4">
                <p className="text-sm font-bold text-brand-800 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Search visibility</p>
                <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                  Customers can find this property via the Customer App using <b>builder name</b>, <b>project name</b>, <b>area</b> or <b>Sale/Rent</b> filters.
                </p>
              </div>
              {editing && (
                <Button variant="primary" className="w-full" icon={Save} loading={saving} onClick={submit}>Save changes</Button>
              )}
            </CardBody>
          </Card>

          {/* Live summary */}
          <Card className="animate-fade-up" style={{ animationDelay: '160ms' }}>
            <CardBody>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <Compass className="w-3.5 h-3.5 text-violet-500" /> Quick summary
              </p>
              <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-4 text-white shadow-lg shadow-violet-500/20 mb-4">
                <p className="text-[11px] font-semibold text-violet-100 uppercase tracking-wider">
                  {form.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </p>
                <p className="font-display text-2xl font-extrabold mt-0.5">
                  {form.total_amount ? `₹${Number(form.total_amount).toLocaleString('en-IN')}` : '₹ —'}
                </p>
                {form.rate_per_sqft && (
                  <p className="text-xs text-violet-100 mt-1">₹{Number(form.rate_per_sqft).toLocaleString('en-IN')} per sq.ft</p>
                )}
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-slate-400" /> Type</span>
                  <Badge tone="cyan" className="capitalize">{form.property_type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><StatusBadge status={form.status} /></span>
                  <span className="font-semibold text-slate-700 capitalize">{form.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-slate-400" /> Media</span>
                  <span className="font-semibold">{mediaCount} / 15</span>
                </div>
                {form.bedrooms && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-slate-400" /> Bedrooms</span>
                    <span className="font-semibold">{form.bedrooms}</span>
                  </div>
                )}
                {form.bathrooms && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5"><Bath className="w-3.5 h-3.5 text-slate-400" /> Bathrooms</span>
                    <span className="font-semibold">{form.bathrooms}</span>
                  </div>
                )}
                {form.area_sqft && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5 text-slate-400" /> Area</span>
                    <span className="font-semibold">{Number(form.area_sqft).toLocaleString('en-IN')} sqft</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5"><Star className={cx('w-3.5 h-3.5', Number(form.is_featured) === 1 ? 'text-amber-400 fill-current' : 'text-slate-400')} /> Featured</span>
                  <span className="font-semibold">{Number(form.is_featured) === 1 ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
