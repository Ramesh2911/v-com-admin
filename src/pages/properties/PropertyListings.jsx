import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, RotateCcw, BedDouble, Bath, Ruler, MapPin, Star,
  SearchX, LayoutGrid, List, Hash, Eye, Pencil, Trash2, Home, Compass,
  IndianRupee, Camera, TrendingUp, KeyRound, LandPlot,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Button, StatusBadge, EmptyState, Table, TH, TD, TRow,
  SearchInput, Select, Pagination, useToast, Badge, Modal, Textarea,
  ConfirmDialog, TableSkeleton, StatCard,
} from '../../components/ui';
import { fmtMoney, fmtNum, mediaUrl, labelize, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'available', label: 'Available', dot: 'bg-emerald-500' },
  { value: 'sold', label: 'Sold', dot: 'bg-rose-500' },
  { value: 'rented', label: 'Rented', dot: 'bg-violet-500' },
  { value: 'draft', label: 'Draft', dot: 'bg-slate-400' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-slate-300' },
];

export default function PropertyListings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [listingType, setListingType] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [del, setDel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.list({ page, limit: 12, search, status, listing_type: listingType });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, listingType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    propertiesApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const remove = async () => {
    try {
      await propertiesApi.remove(del.id);
      toast.success('Property deleted');
      setDel(null);
      setDetail(null);
      load();
      propertiesApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setListingType(''); setPage(1); };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
              <LandPlot className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Property Listings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {fmtNum(total)} properties across builders and projects
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={() => navigate('/properties/new')}>Add Property</Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Home} label="Total Properties" value={stats.properties?.total} tone="violet" delay="0ms" />
          <StatCard icon={Compass} label="Available" value={stats.properties?.available} tone="emerald" delay="60ms" />
          <StatCard icon={TrendingUp} label="For Sale" value={stats.properties?.for_sale} tone="cyan" delay="120ms" />
          <StatCard icon={KeyRound} label="For Rent" value={stats.properties?.for_rent} tone="amber" delay="180ms" />
        </div>
      )}

      {/* ============ Status chips ============ */}
      <div className="mb-5 overflow-x-auto animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit min-w-full">
          {STATUS_TABS.map((t) => {
            const active = status === t.value;
            return (
              <button
                key={t.value}
                onClick={() => { setStatus(t.value); setPage(1); }}
                className={cx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150',
                  active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.dot && <span className={cx('h-1.5 w-1.5 rounded-full', t.dot)} />}
                {t.label}
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
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search title, builder, area…"
            className="flex-1 min-w-[220px]"
          />
          <Select value={listingType} onChange={(e) => { setListingType(e.target.value); setPage(1); }} className="w-40">
            <option value="">Sale &amp; Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
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
                  view === v.v ? 'bg-white text-violet-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || status || listingType) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={clearFilters}>Clear</Button>
          )}
        </CardBody>
      </Card>

      {/* ============ Content ============ */}
      {loading ? (
        <Card className="animate-fade-up">
          {view === 'table' ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No properties found"
            message="List your first property — it will be searchable by builder, project and area."
            action={<Button icon={Plus} onClick={() => navigate('/properties/new')}>Add Property</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((p, i) => {
              const cover = p.media?.find((m) => m.type === 'image')?.url;
              return (
                <Card
                  key={p.id}
                  hover
                  onClick={() => setDetail(p)}
                  className="overflow-hidden group animate-fade-up"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                    {cover ? (
                      <img src={mediaUrl(cover)} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-300">
                        <Home className="w-9 h-9" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">No photo</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge tone={p.listing_type === 'sale' ? 'emerald' : 'cyan'} className="font-bold">
                        {p.listing_type === 'sale' ? <TrendingUp className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                        {p.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      </Badge>
                      {Number(p.is_featured) === 1 && (
                        <Badge tone="amber" className="font-bold"><Star className="w-3 h-3 fill-current" /> Featured</Badge>
                      )}
                    </div>
                    <div className="absolute top-3 right-3"><StatusBadge status={p.status} /></div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow-lg ring-1 ring-slate-900/5">
                      <p className="font-display font-extrabold text-slate-900 flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5 text-violet-500" />
                        {fmtMoney(p.total_amount).replace('₹', '')}
                      </p>
                      {p.rate_per_sqft && (
                        <p className="text-[10px] text-slate-500">₹{Number(p.rate_per_sqft).toLocaleString('en-IN')}/sq.ft</p>
                      )}
                    </div>
                  </div>
                  <CardBody>
                    <p className="font-mono text-[10px] font-bold text-violet-600 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {p.property_code}
                    </p>
                    <h3 className="font-display font-bold text-slate-900 mt-0.5 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {p.area_name}, {p.city} · {p.builder_name}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                      {p.area_sqft && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5 text-slate-400" />{Number(p.area_sqft).toLocaleString('en-IN')} sqft</span>}
                      {p.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-slate-400" />{p.bedrooms} bed</span>}
                      {p.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" />{p.bathrooms} bath</span>}
                      {p.floor && <span className="text-slate-500">Floor {p.floor}/{p.total_floors || '—'}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Camera className="w-3 h-3" /> {p.media?.length || 0} media
                      </span>
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {fmtNum(p.view_count)}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
          <Card className="mt-6">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </Card>
        </>
      ) : (
        <>
          <Card className="animate-fade-up overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <TH>Property</TH>
                  <TH className="hidden lg:table-cell">Builder / Area</TH>
                  <TH>Type</TH>
                  <TH className="hidden md:table-cell">Specs</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH align="right">Actions</TH>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const cover = p.media?.find((m) => m.type === 'image')?.url;
                  return (
                    <TRow key={p.id} onClick={() => setDetail(p)}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                            {cover ? (
                              <img src={mediaUrl(cover)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Home className="w-4.5 h-4.5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] font-bold text-violet-600 flex items-center gap-1"><Hash className="w-3 h-3" />{p.property_code}</p>
                            <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden lg:table-cell">
                        <p className="font-medium text-slate-700">{p.builder_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.area_name}, {p.city}</p>
                      </TD>
                      <TD>
                        <Badge tone={p.listing_type === 'sale' ? 'emerald' : 'cyan'} className="font-bold">
                          {p.listing_type === 'sale' ? 'Sale' : 'Rent'}
                        </Badge>
                        <p className="text-[11px] text-slate-400 mt-1 capitalize">{p.property_type}</p>
                      </TD>
                      <TD className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          {p.area_sqft && <span className="flex items-center gap-1"><Ruler className="w-3 h-3 text-slate-400" />{Number(p.area_sqft).toLocaleString('en-IN')}</span>}
                          {p.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3 text-slate-400" />{p.bedrooms}B</span>}
                          {p.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3 text-slate-400" />{p.bathrooms}B</span>}
                        </div>
                      </TD>
                      <TD>
                        <p className="font-bold text-slate-900">{fmtMoney(p.total_amount)}</p>
                        {p.rate_per_sqft && <p className="text-[10px] text-slate-400">₹{Number(p.rate_per_sqft).toLocaleString('en-IN')}/sq.ft</p>}
                      </TD>
                      <TD>
                        <StatusBadge status={p.status} />
                        {Number(p.is_featured) === 1 && (
                          <Badge tone="amber" className="mt-1 font-bold"><Star className="w-3 h-3 fill-current" /> Featured</Badge>
                        )}
                      </TD>
                      <TD align="right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" title="View" onClick={() => setDetail(p)}><Eye className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => navigate(`/properties/${p.id}/edit`)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" title="Delete" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setDel(p)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TD>
                    </TRow>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </Card>
          <div className="mt-4" />
        </>
      )}

      {/* ============ Detail modal ============ */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title}
        subtitle={detail?.property_code}
        icon={Building2}
        size="xl"
        footer={
          <>
            <Button variant="danger" icon={Trash2} onClick={() => setDel(detail)}>Delete</Button>
            <Button icon={Pencil} onClick={() => navigate(`/properties/${detail?.id}/edit`)}>Edit property</Button>
          </>
        }
      >
        {detail && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Gallery */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                {(detail.media || []).slice(0, 6).map((m) => (
                  <div key={m.id} className="rounded-xl overflow-hidden ring-1 ring-slate-200 aspect-[4/3] bg-slate-100 group/media relative">
                    {m.type === 'image' ? (
                      <img src={mediaUrl(m.url)} alt="" className="w-full h-full object-cover group-hover/media:scale-105 transition duration-500" />
                    ) : (
                      <video src={mediaUrl(m.url)} className="w-full h-full object-cover" controls />
                    )}
                    {m.type === 'video' && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-slate-900/60 backdrop-blur px-1.5 py-0.5 rounded-md">VIDEO</span>
                    )}
                  </div>
                ))}
                {!detail.media?.length && (
                  <div className="col-span-3 rounded-2xl bg-slate-100 h-48 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                    <Camera className="w-6 h-6" />
                    <span className="text-sm font-medium">No media uploaded</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Camera className="w-3 h-3" /> {detail.media?.length || 0} media files
              </p>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone={detail.listing_type === 'sale' ? 'emerald' : 'cyan'} className="font-bold">
                  {detail.listing_type === 'sale' ? <TrendingUp className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                  {detail.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </Badge>
                <Badge>{labelize(detail.property_type)}</Badge>
                <StatusBadge status={detail.status} />
                {Number(detail.is_featured) === 1 && (
                  <Badge tone="amber" className="font-bold"><Star className="w-3 h-3 fill-current" /> Featured</Badge>
                )}
              </div>
              <p className="font-display text-3xl font-extrabold text-slate-900 flex items-center gap-1">
                <IndianRupee className="w-6 h-6 text-violet-500" />
                {fmtMoney(detail.total_amount).replace('₹', '')}
              </p>
              {detail.rate_per_sqft && (
                <p className="text-sm text-slate-500">₹{Number(detail.rate_per_sqft).toLocaleString('en-IN')} per sq.ft</p>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Builder</p><p className="font-semibold">{detail.builder_name}</p></div>
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Project</p><p className="font-semibold">{detail.project_name || '—'}</p></div>
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Area</p><p className="font-semibold">{detail.area_name}, {detail.city}</p></div>
                <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Facing</p><p className="font-semibold">{detail.facing || '—'}</p></div>
                {detail.area_sqft && <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Area</p><p className="font-semibold">{Number(detail.area_sqft).toLocaleString('en-IN')} sqft</p></div>}
                {detail.floor && <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3"><p className="text-xs text-slate-500">Floor</p><p className="font-semibold">{detail.floor} of {detail.total_floors}</p></div>}
              </div>
              {detail.address && <p className="text-sm text-slate-600 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />{detail.address}</p>}
              <p className="text-xs text-slate-400 flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtNum(detail.view_count)} views</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        title="Delete property?"
        message={`${del?.title} and all its media will be permanently removed.`}
        confirmText="Delete"
      />
    </>
  );
}
