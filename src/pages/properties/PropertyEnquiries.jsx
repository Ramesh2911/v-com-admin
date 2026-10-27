import { useCallback, useEffect, useState } from 'react';
import {
  BellRing, RotateCcw, Phone, Mail, MapPin, SearchX, LayoutGrid, List,
  Building2, Hash, User, MessageSquare, Home, IndianRupee, Eye, Send,
  Sparkles, Flag,
} from 'lucide-react';
import { propertiesApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardBody, Table, TH, TD, TRow, Pagination, SearchInput,
  Button, StatusBadge, EmptyState, useToast, Badge, Modal,
  TableSkeleton, StatCard,
} from '../../components/ui';
import { fmtDateTime, fmtDate, fmtMoney, fmtNum, timeAgo, cx } from '../../lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All', dot: null },
  { value: 'new', label: 'New', dot: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', dot: 'bg-cyan-500' },
  { value: 'follow_up', label: 'Follow Up', dot: 'bg-amber-500' },
  { value: 'closed', label: 'Closed', dot: 'bg-slate-400' },
];

const STATUSES = ['new', 'contacted', 'follow_up', 'closed'];

const statusDot = {
  new: 'bg-blue-500 shadow-blue-500/40',
  contacted: 'bg-cyan-500 shadow-cyan-500/40',
  follow_up: 'bg-amber-500 shadow-amber-500/40',
  closed: 'bg-slate-400 shadow-slate-400/40',
};

export default function PropertyEnquiries() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('table');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await propertiesApi.enquiries({ page, limit: 15, search, status });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    propertiesApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const updateStatus = async () => {
    setSaving(true);
    try {
      await propertiesApi.setEnquiryStatus(statusModal.id, { status: newStatus });
      toast.success('Enquiry updated');
      setStatusModal(null);
      load();
      propertiesApi.stats().then((r) => setStats(r.data.data)).catch(() => {});
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-500/30 flex items-center justify-center shrink-0">
            <BellRing className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Properties
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Property Enquiries</h1>
            <p className="text-sm text-slate-500 mt-0.5">{fmtNum(total)} enquiry tickets from the customer app</p>
          </div>
        </div>
        <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
      </div>

      {/* ============ Stats ============ */}
      {stats?.enquiries && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon={BellRing} label="Total Enquiries" value={stats.enquiries.total} tone="brand" delay="0ms" />
          <StatCard icon={Sparkles} label="New Enquiries" value={stats.enquiries.new_count} tone="cyan" delay="60ms" sub="Awaiting first response" />
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
            placeholder="Search ticket, name, phone or property…"
            className="flex-1 min-w-[220px]"
          />
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { v: 'table', icon: List, label: 'Table view' },
              { v: 'grid', icon: LayoutGrid, label: 'Grid view' },
            ].map((v) => (
              <button
                key={v.v}
                onClick={() => setView(v.v)}
                title={v.label}
                aria-label={v.label}
                className={cx(
                  'p-1.5 rounded-lg transition-all duration-150',
                  view === v.v ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {(search || status) && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Clear</Button>
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
                <div key={i} className="skeleton h-52 rounded-2xl" />
              ))}
            </div>
          )}
        </Card>
      ) : items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={SearchX}
            title="No enquiries"
            message="When a customer submits an enquiry on a property, a V-COM ticket is generated here."
            action={
              (search || status) && (
                <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); setPage(1); }}>Clear filters</Button>
              )
            }
          />
        </Card>
      ) : view === 'table' ? (
        <Card className="animate-fade-up overflow-hidden">
          <Table>
            <thead>
              <tr>
                <TH>Ticket</TH>
                <TH>Enquirer</TH>
                <TH>Property</TH>
                <TH className="hidden lg:table-cell">Builder / Area</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Date</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <TRow key={e.id} onClick={() => setDetail(e)}>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 ring-1 ring-brand-200 px-2 py-1 font-mono text-xs font-bold text-brand-700">
                      <Hash className="w-3 h-3" /> {e.ticket_no}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-brand-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{e.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{e.phone}</p>
                        {e.email && <p className="text-xs text-slate-500 flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{e.email}</p>}
                      </div>
                    </div>
                  </TD>
                  <TD className="max-w-[200px]">
                    <p className="text-sm font-medium truncate">{e.property_title}</p>
                    <p className="text-xs text-slate-500 font-mono">{e.property_code}</p>
                    <Badge tone={e.listing_type === 'sale' ? 'emerald' : 'cyan'} className="mt-1 font-bold">{e.listing_type}</Badge>
                  </TD>
                  <TD className="hidden lg:table-cell text-sm">
                    <p className="font-medium text-slate-700">{e.builder_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.area_name}, {e.city}</p>
                  </TD>
                  <TD><StatusBadge status={e.status} /></TD>
                  <TD className="hidden md:table-cell">
                    <p className="text-slate-600 text-xs">{fmtDate(e.created_at, 'DD MMM YY')}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(e.created_at)}</p>
                  </TD>
                  <TD align="right">
                    <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                      <Button size="icon" variant="ghost" title="View" onClick={() => setDetail(e)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="secondary" onClick={() => { setStatusModal(e); setNewStatus(e.status); }}>
                        Update
                      </Button>
                    </div>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((e, i) => (
              <Card
                key={e.id}
                hover
                className="relative overflow-hidden p-5 group animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => setDetail(e)}
              >
                <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 ring-1 ring-brand-200 px-2 py-1 font-mono text-xs font-bold text-brand-700">
                    <Hash className="w-3 h-3" /> {e.ticket_no}
                  </span>
                  <StatusBadge status={e.status} />
                </div>
                <div className="relative flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-full bg-brand-50 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-brand-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{e.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{e.phone}</p>
                  </div>
                </div>
                <div className="relative mt-3 rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {e.property_title}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{e.property_code}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge tone={e.listing_type === 'sale' ? 'emerald' : 'cyan'} className="font-bold capitalize">{e.listing_type}</Badge>
                    <span className="text-xs text-slate-500">{fmtMoney(e.total_amount)}</span>
                  </div>
                </div>
                <p className="relative text-[11px] text-slate-400 mt-2">{e.builder_name} · {e.area_name}, {e.city}</p>
                <div className="relative flex gap-2 mt-3 pt-3 border-t border-slate-100" onClick={(ev) => ev.stopPropagation()}>
                  <Button size="sm" variant="secondary" icon={Eye} className="flex-1" onClick={() => setDetail(e)}>View</Button>
                  <Button size="sm" variant="primary" icon={Send} onClick={() => { setStatusModal(e); setNewStatus(e.status); }}>Update</Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} total={total} />
          </div>
        </>
      )}

      {/* ============ Detail modal ============ */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.ticket_no}
        subtitle="Property enquiry"
        icon={BellRing}
        size="lg"
        footer={<Button icon={Send} onClick={() => { setStatusModal(detail); setNewStatus(detail.status); }}>Update status</Button>}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <User className="w-3.5 h-3.5 text-brand-500" /> Enquirer
                </p>
                <p className="font-semibold text-slate-900">{detail.name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5" />{detail.phone}</p>
                {detail.email && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{detail.email}</p>}
              </div>
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <Home className="w-3.5 h-3.5 text-brand-500" /> Property
                </p>
                <p className="font-semibold text-slate-900">{detail.property_title}</p>
                <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> {fmtMoney(detail.total_amount)}
                  <Badge tone={detail.listing_type === 'sale' ? 'emerald' : 'cyan'} className="ml-1 font-bold capitalize">{detail.listing_type}</Badge>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{detail.area_name}, {detail.city}</p>
              </div>
            </div>
            {detail.message && (
              <div className="rounded-2xl bg-brand-50 ring-1 ring-brand-100 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </p>
                <p className="text-sm text-brand-900 whitespace-pre-wrap">{detail.message}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-slate-400">{fmtDateTime(detail.created_at)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ Status update modal ============ */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update enquiry status"
        subtitle={statusModal?.ticket_no}
        icon={Flag}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={updateStatus} icon={Send}>Update</Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewStatus(s)}
                className={cx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  newStatus === s
                    ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500 shadow-sm'
                    : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                )}
              >
                <span className={cx('h-2 w-2 rounded-full shadow-sm', statusDot[s])} />
                {s === 'follow_up' ? 'Follow Up' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
