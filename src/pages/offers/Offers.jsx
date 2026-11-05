import { useCallback, useEffect, useState } from 'react';
import {
  BadgePercent, Plus, Pencil, Trash2, RotateCcw, SearchX, Tag, Ticket,
  Percent, CalendarDays, ImagePlus, Package, Eye, Clock, IndianRupee,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { offersApi, servicesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select,
  StatCard,
} from '../../components/ui';
import { cx, fmtDate } from '../../lib/utils';

function ImagePicker({ preview, onChange, onRemove }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        Banner image <span className="text-slate-400 font-normal">· optional</span>
      </label>
      <div className="flex items-start gap-3">
        <label className="group h-24 w-24 shrink-0 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-50 transition-colors">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-amber-500 transition-colors">
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px] font-bold">Upload</span>
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
        <div className="pt-1 min-w-0">
          <p className="text-xs text-slate-500">JPG / PNG / WEBP · max 10MB</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Stored in Cloudinary · <span className="font-mono">v-com</span> folder</p>
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
  active: { tone: 'emerald', label: 'Active' },
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

const dateOnly = (d) => (d ? String(d).slice(0, 10) : '');

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
      '&:hover': { backgroundColor: 'rgba(245,158,11,0.05)' },
    },
  },
  table: { style: { fontFamily: 'inherit' } },
};

export default function Offers() {
  const toast = useToast();
  const [tab, setTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [offerModal, setOfferModal] = useState(null);
  const [couponModal, setCouponModal] = useState(null);
  const [del, setDel] = useState(null);
  const [offerImage, setOfferImage] = useState(null);
  const [offerImagePreview, setOfferImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyOffer = {
    category_id: '', title: '', description: '', discount_type: 'percent',
    discount_value: '', starts_at: '', ends_at: '', status: 1,
  };
  const emptyCoupon = {
    code: '', title: '', discount_type: 'percent', discount_value: '',
    max_discount: '', min_amount: '', usage_limit: '', per_user_limit: '',
    applies_to: 'all', category_id: '', starts_at: '', ends_at: '', status: 1,
  };
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [couponForm, setCouponForm] = useState(emptyCoupon);

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setOfferImage(f);
    setOfferImagePreview(URL.createObjectURL(f));
  };
  const clearOfferImage = () => {
    setOfferImagePreview((p) => {
      if (p && p.startsWith('blob:')) URL.revokeObjectURL(p);
      return null;
    });
    setOfferImage(null);
  };
  const closeOfferModal = () => {
    clearOfferImage();
    setOfferModal(null);
  };
  const closeCouponModal = () => setCouponModal(null);

  const openOfferModal = (o) => {
    if (o === 'new') {
      setOfferForm({ ...emptyOffer, category_id: categories[0]?.id || '' });
      setOfferImage(null);
      setOfferImagePreview(null);
    } else {
      setOfferForm({
        category_id: o.category_id,
        title: o.title,
        description: o.description || '',
        discount_type: o.discount_type,
        discount_value: String(Number(o.discount_value)),
        starts_at: dateOnly(o.starts_at),
        ends_at: dateOnly(o.ends_at),
        status: Number(o.status),
      });
      setOfferImage(null);
      setOfferImagePreview(o.image || null);
    }
    setOfferModal(o);
  };

  const openCouponModal = (c) => {
    if (c === 'new') {
      setCouponForm({ ...emptyCoupon });
    } else {
      setCouponForm({
        code: c.code,
        title: c.title || '',
        discount_type: c.discount_type,
        discount_value: String(Number(c.discount_value)),
        max_discount: c.max_discount != null ? String(Number(c.max_discount)) : '',
        min_amount: c.min_amount != null ? String(Number(c.min_amount)) : '',
        usage_limit: c.usage_limit != null ? String(c.usage_limit) : '',
        per_user_limit: c.per_user_limit != null ? String(c.per_user_limit) : '',
        applies_to: c.applies_to || 'all',
        category_id: c.category_id || '',
        starts_at: dateOnly(c.starts_at),
        ends_at: dateOnly(c.ends_at),
        status: Number(c.status),
      });
    }
    setCouponModal(c);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([offersApi.offers(), offersApi.coupons(), servicesApi.categories()])
      .then(([o, c, cats]) => {
        setOffers(o.data.data);
        setCoupons(c.data.data);
        setCategories(cats.data.data);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const saveOffer = async () => {
    if (!offerForm.category_id) return toast.error('Service is required');
    if (!offerForm.title.trim()) return toast.error('Title is required');
    if (!offerForm.discount_value || Number(offerForm.discount_value) <= 0) {
      return toast.error('Discount value must be greater than 0');
    }
    if (offerForm.starts_at && offerForm.ends_at && offerForm.starts_at > offerForm.ends_at) {
      return toast.error('Start date must be before end date');
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(offerForm).forEach(([k, v]) => {
        if (k === 'starts_at' || k === 'ends_at') return;
        if (v !== '' && v != null) fd.append(k, v);
      });
      fd.append('starts_at', offerForm.starts_at || '');
      fd.append('ends_at', offerForm.ends_at || '');
      if (offerImage) fd.append('image', offerImage);
      if (offerModal === 'new') { await offersApi.createOffer(fd); toast.success('Offer created'); }
      else { await offersApi.updateOffer(offerModal.id, fd); toast.success('Offer updated'); }
      closeOfferModal();
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const saveCoupon = async () => {
    const code = couponForm.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error('Code must be 3-30 characters (A-Z, 0-9, - or _)');
    if (!couponForm.discount_value || Number(couponForm.discount_value) <= 0) {
      return toast.error('Discount value must be greater than 0');
    }
    if (couponForm.applies_to === 'category' && !couponForm.category_id) {
      return toast.error('Select a service for this coupon');
    }
    if (couponForm.starts_at && couponForm.ends_at && couponForm.starts_at > couponForm.ends_at) {
      return toast.error('Start date must be before end date');
    }
    setSaving(true);
    try {
      const payload = { ...couponForm, code };
      if (couponModal === 'new') { await offersApi.createCoupon(payload); toast.success('Coupon created'); }
      else { await offersApi.updateCoupon(couponModal.id, payload); toast.success('Coupon updated'); }
      closeCouponModal();
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      if (del.kind === 'offer') await offersApi.deleteOffer(del.id);
      else await offersApi.deleteCoupon(del.id);
      toast.success('Deleted');
      setDel(null);
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const liveOffers = offers.filter((o) => effStatus(o) === 'active').length;
  const liveCoupons = coupons.filter((c) => effStatus(c) === 'active').length;

  const term = q.trim().toLowerCase();
  const filteredOffers = !term
    ? offers
    : offers.filter((o) =>
        `${o.title} ${o.description || ''} ${o.category_name || ''} ${o.module_name || ''}`.toLowerCase().includes(term)
      );
  const filteredCoupons = !term
    ? coupons
    : coupons.filter((c) => `${c.code} ${c.title || ''}`.toLowerCase().includes(term));

  const discountCell = (type, value) =>
    type === 'percent' ? (
      <Badge tone="emerald" className="font-bold"><Percent className="w-3 h-3" /> {Number(value)}% off</Badge>
    ) : (
      <Badge tone="sky" className="font-bold"><IndianRupee className="w-3 h-3" /> {Number(value)} off</Badge>
    );

  const statusCell = (r) => {
    const m = STATUS_META[effStatus(r)];
    return (
      <Badge tone={m.tone} dot className="font-bold">{m.label}</Badge>
    );
  };

  const offerColumns = [
    {
      name: 'Offer',
      selector: (r) => r.title,
      sortable: true,
      grow: 2,
      cell: (o) => (
        <div className="flex items-center gap-3">
          {o.image ? (
            <img src={o.image} alt="" className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200 shadow-sm shrink-0" />
          ) : (
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 shadow-md flex items-center justify-center shrink-0">
              <BadgePercent className="w-4 h-4 text-white" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{o.title}</p>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{o.description || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Service',
      selector: (r) => r.category_name || '',
      sortable: true,
      grow: 1,
      cell: (o) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{o.category_name}</p>
          <p className="text-xs text-slate-400 truncate">{o.module_name}</p>
        </div>
      ),
    },
    {
      name: 'Discount',
      selector: (r) => Number(r.discount_value),
      sortable: true,
      width: '130px',
      cell: (o) => discountCell(o.discount_type, o.discount_value),
    },
    {
      name: 'Window',
      selector: (r) => r.starts_at || r.ends_at || '',
      sortable: true,
      width: '210px',
      cell: (o) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {windowText(o)}
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
      cell: (o) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openOfferModal(o)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ kind: 'offer', id: o.id, name: o.title })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const couponColumns = [
    {
      name: 'Code',
      selector: (r) => r.code,
      sortable: true,
      width: '150px',
      cell: (c) => (
        <span className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-bold tracking-wider text-amber-300 ring-1 ring-slate-700">
          {c.code}
        </span>
      ),
    },
    {
      name: 'Title',
      selector: (r) => r.title || '',
      sortable: true,
      grow: 2,
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{c.title || '—'}</p>
          <p className="text-xs text-slate-400">
            {c.applies_to === 'category' ? `Service: ${c.category_name || '—'}` : 'All services'}
          </p>
        </div>
      ),
    },
    {
      name: 'Discount',
      selector: (r) => Number(r.discount_value),
      sortable: true,
      width: '130px',
      cell: (c) => discountCell(c.discount_type, c.discount_value),
    },
    {
      name: 'Rules',
      selector: (r) => (r.min_amount != null ? Number(r.min_amount) : Infinity),
      sortable: true,
      width: '160px',
      cell: (c) => (
        <div className="text-xs text-slate-500 leading-relaxed">
          <p>{c.min_amount != null ? `Min ${Number(c.min_amount).toLocaleString('en-IN')}` : 'No minimum'}</p>
          <p className="text-slate-400">{c.max_discount != null ? `Cap ${Number(c.max_discount).toLocaleString('en-IN')}` : 'No cap'}</p>
        </div>
      ),
    },
    {
      name: 'Usage',
      selector: (r) => Number(r.used_count),
      sortable: true,
      width: '110px',
      cell: (c) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          <Eye className="w-3 h-3" /> {c.used_count} / {c.usage_limit != null ? c.usage_limit : '∞'}
        </span>
      ),
    },
    {
      name: 'Window',
      selector: (r) => r.starts_at || r.ends_at || '',
      sortable: true,
      width: '200px',
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {windowText(c)}
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
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openCouponModal(c)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete" className="text-rose-600 hover:bg-rose-50" onClick={() => setDel({ kind: 'coupon', id: c.id, name: c.code })}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  const categoriesForSelect = [...categories].sort((a, b) =>
    `${a.module_name}${a.sort_order}`.localeCompare(`${b.module_name}${b.sort_order}`)
  );

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
            <BadgePercent className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Growth
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Offers &amp; Coupons</h1>
            <p className="text-sm text-slate-500 mt-0.5">Discounts on specific services, and promo codes for customers</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Tag} label="Offers" value={offers.length} tone="brand" delay="0ms" />
        <StatCard icon={Eye} label="Live offers" value={liveOffers} tone="emerald" delay="60ms" />
        <StatCard icon={Ticket} label="Coupons" value={coupons.length} tone="cyan" delay="120ms" />
        <StatCard icon={Percent} label="Live coupons" value={liveCoupons} tone="amber" delay="180ms" />
      </div>

      {/* ============ Tabs ============ */}
      <div className="mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {[
            { value: 'offers', label: 'Offers', count: offers.length, icon: Tag },
            { value: 'coupons', label: 'Coupons', count: coupons.length, icon: Ticket },
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
                <t.icon className={cx('w-4 h-4', active ? 'text-amber-500' : 'text-slate-400')} />
                {t.label}
                <span className={cx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-amber-50 text-amber-600' : 'bg-slate-200/80 text-slate-500'
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
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : tab === 'offers' ? (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Service Offers</h3>
                <p className="text-sm text-slate-500">{offers.length} offers across {categories.length} services</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openOfferModal('new')}>Add Offer</Button>
          </div>
          {offers.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No offers yet"
              message="Create a discount banner against any service — customers see it in the app."
              action={<Button icon={Plus} onClick={() => openOfferModal('new')}>Add Offer</Button>}
            />
          ) : (
            <DataTable
              columns={offerColumns}
              data={filteredOffers}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {filteredOffers.length} of {offers.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Search offers…" className="w-full sm:w-72" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No offers match your search</p>
                  <button type="button" onClick={() => setQ('')} className="mt-1 text-xs font-bold text-amber-600 hover:underline">
                    Clear search
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-500/25 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Coupon Codes</h3>
                <p className="text-sm text-slate-500">{coupons.length} codes · customers enter them at checkout</p>
              </div>
            </div>
            <Button icon={Plus} onClick={() => openCouponModal('new')}>Add Coupon</Button>
          </div>
          {coupons.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No coupons yet"
              message="Create a promo code — percent or flat discount with optional limits."
              action={<Button icon={Plus} onClick={() => openCouponModal('new')}>Add Coupon</Button>}
            />
          ) : (
            <DataTable
              columns={couponColumns}
              data={filteredCoupons}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {filteredCoupons.length} of {coupons.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Search code or title…" className="w-full sm:w-72" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No coupons match your search</p>
                  <button type="button" onClick={() => setQ('')} className="mt-1 text-xs font-bold text-amber-600 hover:underline">
                    Clear search
                  </button>
                </div>
              }
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      {/* ============ Offer form modal ============ */}
      <Modal
        open={!!offerModal}
        onClose={closeOfferModal}
        title={offerModal === 'new' ? 'Add offer' : 'Edit offer'}
        subtitle={offerModal === 'new' ? 'A discount against one specific service' : offerModal?.title}
        icon={Tag}
        footer={
          <>
            <Button variant="secondary" onClick={closeOfferModal}>Cancel</Button>
            <Button loading={saving} onClick={saveOffer} icon={offerModal === 'new' ? Plus : Pencil}>
              {offerModal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Service"
            required
            value={offerForm.category_id}
            onChange={(e) => setOfferForm({ ...offerForm, category_id: e.target.value })}
          >
            <option value="">Select service…</option>
            {categoriesForSelect.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.module_name}</option>
            ))}
          </Select>
          <Input
            label="Title"
            required
            value={offerForm.title}
            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
            placeholder="e.g. 25% off on Electrical Work"
            icon={Tag}
          />
          <Textarea
            label="Description"
            value={offerForm.description}
            onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
            placeholder="Short marketing line shown in the app"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={offerForm.discount_type}
              onChange={(e) => setOfferForm({ ...offerForm, discount_type: e.target.value })}
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat amount</option>
            </Select>
            <Input
              label={offerForm.discount_type === 'percent' ? 'Percent off' : 'Amount off'}
              required
              type="number"
              min="0"
              max={offerForm.discount_type === 'percent' ? '100' : undefined}
              value={offerForm.discount_value}
              onChange={(e) => setOfferForm({ ...offerForm, discount_value: e.target.value })}
              placeholder={offerForm.discount_type === 'percent' ? 'e.g. 25' : 'e.g. 100'}
              icon={Percent}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="date"
              value={offerForm.starts_at}
              onChange={(e) => setOfferForm({ ...offerForm, starts_at: e.target.value })}
              icon={CalendarDays}
            />
            <Input
              label="Ends"
              type="date"
              value={offerForm.ends_at}
              onChange={(e) => setOfferForm({ ...offerForm, ends_at: e.target.value })}
              icon={CalendarDays}
            />
          </div>
          <p className="text-[11px] text-slate-400 -mt-2">Leave dates empty for an always-on offer. End date counts to 23:59.</p>
          <ImagePicker
            preview={offerImagePreview}
            onChange={pickImage}
            onRemove={clearOfferImage}
          />
          <Select
            label="Status"
            value={offerForm.status}
            onChange={(e) => setOfferForm({ ...offerForm, status: Number(e.target.value) })}
          >
            <option value={1}>Active</option>
            <option value={0}>Hidden</option>
          </Select>
        </div>
      </Modal>

      {/* ============ Coupon form modal ============ */}
      <Modal
        open={!!couponModal}
        onClose={closeCouponModal}
        title={couponModal === 'new' ? 'Add coupon' : 'Edit coupon'}
        subtitle={couponModal === 'new' ? 'A promo code customers can redeem' : couponModal?.code}
        icon={Ticket}
        footer={
          <>
            <Button variant="secondary" onClick={closeCouponModal}>Cancel</Button>
            <Button loading={saving} onClick={saveCoupon} icon={couponModal === 'new' ? Plus : Pencil}>
              {couponModal === 'new' ? 'Create' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              required
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
              icon={Ticket}
            />
            <Input
              label="Title"
              value={couponForm.title}
              onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
              placeholder="e.g. Winter sale"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={couponForm.discount_type}
              onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
            >
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat amount</option>
            </Select>
            <Input
              label={couponForm.discount_type === 'percent' ? 'Percent off' : 'Amount off'}
              required
              type="number"
              min="0"
              max={couponForm.discount_type === 'percent' ? '100' : undefined}
              value={couponForm.discount_value}
              onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
              placeholder={couponForm.discount_type === 'percent' ? 'e.g. 20' : 'e.g. 50'}
              icon={Percent}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min amount"
              type="number"
              min="0"
              value={couponForm.min_amount}
              onChange={(e) => setCouponForm({ ...couponForm, min_amount: e.target.value })}
              placeholder="No minimum"
              icon={IndianRupee}
            />
            <Input
              label="Max discount cap"
              type="number"
              min="0"
              value={couponForm.max_discount}
              onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })}
              placeholder="No cap"
              icon={IndianRupee}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total usage limit"
              type="number"
              min="1"
              value={couponForm.usage_limit}
              onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
              placeholder="Unlimited"
              icon={Eye}
            />
            <Input
              label="Per-customer limit"
              type="number"
              min="1"
              value={couponForm.per_user_limit}
              onChange={(e) => setCouponForm({ ...couponForm, per_user_limit: e.target.value })}
              placeholder="Unlimited"
              icon={Eye}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Applies to</label>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit">
              {[
                { v: 'all', label: 'All services' },
                { v: 'category', label: 'One service' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setCouponForm({ ...couponForm, applies_to: o.v })}
                  className={cx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                    couponForm.applies_to === o.v
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {couponForm.applies_to === 'category' && (
            <Select
              label="Service"
              required
              value={couponForm.category_id}
              onChange={(e) => setCouponForm({ ...couponForm, category_id: e.target.value })}
            >
              <option value="">Select service…</option>
              {categoriesForSelect.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.module_name}</option>
              ))}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="date"
              value={couponForm.starts_at}
              onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
              icon={CalendarDays}
            />
            <Input
              label="Ends"
              type="date"
              value={couponForm.ends_at}
              onChange={(e) => setCouponForm({ ...couponForm, ends_at: e.target.value })}
              icon={CalendarDays}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={couponForm.status}
              onChange={(e) => setCouponForm({ ...couponForm, status: Number(e.target.value) })}
            >
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
        message={`${del?.name || 'This item'} will be permanently removed.`}
        confirmText="Delete"
      />
    </>
  );
}
