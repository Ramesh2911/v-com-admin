import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, CheckCircle2, XCircle, AlertOctagon, MapPin,
  Phone, Paperclip, FileText, Flag, History, ClipboardList, User,
  Building2, CalendarClock, Hash, Tag,
} from 'lucide-react';
import { requestsApi, vendorsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardHeader, CardBody, Button, StatusBadge, PageLoader, EmptyState,
  InfoRow, useToast, Modal, Select, Textarea, Badge, PriorityBadge, Avatar,
} from '../../components/ui';
import { fmtDateTime, fmtMoney, fmtDate, mediaUrl, labelize, timeAgo, cx } from '../../lib/utils';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    requestsApi
      .get(id)
      .then((res) => {
        setReq(res.data.data);
        setNewStatus(res.data.data.status);
      })
      .catch((err) => toast.error(getError(err)))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  useEffect(() => {
    if (assignOpen) {
      vendorsApi.list({ status: 'approved', limit: 100 }).then((r) => setVendors(r.data.data.items)).catch(() => {});
    }
  }, [assignOpen]);

  const assign = async () => {
    if (!vendorId) return toast.error('Select a vendor');
    setSaving(true);
    try {
      await requestsApi.assign(id, { vendor_id: Number(vendorId), note: assignNote });
      toast.success('Vendor assigned');
      setAssignOpen(false);
      setVendorId('');
      setAssignNote('');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    setSaving(true);
    try {
      await requestsApi.setStatus(id, { status: newStatus, note: statusNote });
      toast.success('Status updated');
      setStatusOpen(false);
      setStatusNote('');
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const doConfirm = async () => {
    setSaving(true);
    try {
      if (confirm.type === 'close') {
        await requestsApi.close(id, confirm.note);
        toast.success('Request closed');
      } else if (confirm.type === 'escalate') {
        await requestsApi.escalate(id, confirm.note);
        toast.success('Request escalated to urgent');
      }
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!req) return <EmptyState title="Request not found" />;

  const STATUSES = ['pending_review', 'assigned', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'closed', 'cancelled'];
  const images = (req.attachments || []).filter((a) => a.file_type === 'image');
  const docs = (req.attachments || []).filter((a) => a.file_type !== 'image');
  const isActive = !['completed', 'closed', 'cancelled'].includes(req.status);

  const timelineTone = (s) => {
    if (['completed', 'closed'].includes(s)) return 'bg-emerald-500 shadow-emerald-500/40';
    if (['in_progress', 'scheduled'].includes(s)) return 'bg-cyan-500 shadow-cyan-500/40';
    if (s === 'cancelled') return 'bg-rose-500 shadow-rose-500/40';
    return 'bg-brand-500 shadow-brand-500/40';
  };

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/requests')}
            className="h-11 w-11 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:ring-slate-300 hover:-translate-x-0.5 transition-all shrink-0"
            title="Back to requests"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <button
              onClick={() => navigate('/requests')}
              className="text-xs font-semibold text-amber-600 uppercase tracking-wider hover:text-amber-700 transition-colors"
            >
              Requests
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
              {req.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 ring-1 ring-brand-200 px-2 py-0.5 font-mono text-xs font-bold text-brand-700">
                <Hash className="w-3 h-3" /> {req.ticket_no}
              </span>
              <StatusBadge status={req.status} />
              <PriorityBadge priority={req.priority} />
            </div>
          </div>
        </div>
        {isActive && (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={UserPlus} onClick={() => setAssignOpen(true)}>
              {req.assigned_vendor_id ? 'Reassign' : 'Assign vendor'}
            </Button>
            <Button variant="secondary" icon={Flag} onClick={() => setStatusOpen(true)}>Update status</Button>
            <Button variant="warning" icon={AlertOctagon} onClick={() => setConfirm({ type: 'escalate', note: '' })}>Escalate</Button>
            <Button variant="danger" icon={XCircle} onClick={() => setConfirm({ type: 'close', note: '' })}>Close</Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ Main info ============ */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-fade-up overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <CardBody>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge tone="brand"><ClipboardList className="w-3 h-3" /> {req.module_name}</Badge>
                {req.category_name && <Badge><Tag className="w-3 h-3" /> {req.category_name}</Badge>}
                {req.source && <Badge tone="slate">{labelize(req.source)}</Badge>}
              </div>
              {req.description && (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{req.description}</p>
              )}
              {req.specifications && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Specifications</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.specifications}</p>
                </>
              )}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />
              <div className="grid sm:grid-cols-2 gap-x-8">
                <InfoRow label="Quantity" value={req.quantity} />
                <InfoRow label="Site" value={req.site_location} />
                <InfoRow label="City" value={req.city} />
                <InfoRow label="Est. amount" value={fmtMoney(req.estimated_amount)} />
                <InfoRow label="Source" value={labelize(req.source)} />
                <InfoRow label="Submitted" value={fmtDateTime(req.created_at)} />
              </div>
            </CardBody>
          </Card>

          {/* Attachments */}
          {(images.length > 0 || docs.length > 0) && (
            <Card className="animate-fade-up" style={{ animationDelay: '80ms' }}>
              <CardHeader icon={Paperclip} title="Attachments" subtitle={`${req.attachments.length} file(s)`} />
              <CardBody>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {images.map((a) => (
                      <a key={a.id} href={mediaUrl(a.url)} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden ring-1 ring-slate-200 aspect-square">
                        <img src={mediaUrl(a.url)} alt={a.original_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-[10px] text-white truncate">{a.original_name}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                {docs.length > 0 && (
                  <div className="space-y-2">
                    {docs.map((a) => (
                      <a key={a.id} href={mediaUrl(a.url)} target="_blank" rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl bg-slate-50 hover:bg-brand-50/60 ring-1 ring-transparent hover:ring-brand-200 px-4 py-3 transition-all duration-150">
                        <span className="h-8 w-8 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </span>
                        <span className="text-sm text-slate-700 truncate flex-1">{a.original_name}</span>
                        <Badge>{a.file_type}</Badge>
                      </a>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Quotations */}
          <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
            <CardHeader icon={FileText} title="Quotations" subtitle={`${req.quotations?.length || 0} quotation(s)`} />
            {!req.quotations?.length ? (
              <EmptyState icon={FileText} title="No quotations yet" message="Vendor quotations appear here." />
            ) : (
              <div className="divide-y divide-slate-100">
                {req.quotations.map((q) => (
                  <div key={q.id} className="group flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gradient-to-r hover:from-amber-50/60 hover:to-orange-50/40 transition-all duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4 text-amber-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-brand-600">{q.ticket_no}</p>
                        <p className="text-sm font-semibold text-slate-800">{q.vendor_name}</p>
                        <p className="text-xs text-slate-500">{fmtDate(q.created_at)} · {timeAgo(q.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-display font-extrabold text-lg text-slate-900">{fmtMoney(q.total_amount)}</p>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ============ Sidebar ============ */}
        <div className="space-y-6">
          {/* Customer */}
          <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '60ms' }}>
            <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-violet-500" />
            <CardHeader icon={User} title="Customer" />
            <CardBody>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={req.customer_name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{req.customer_name}</p>
                  <p className="text-xs text-slate-500 truncate">{req.customer_email}</p>
                </div>
              </div>
              {req.customer_phone && (
                <p className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{req.customer_phone}</p>
              )}
              {req.site_location && (
                <p className="flex items-start gap-2 text-sm text-slate-600 mt-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />{req.site_location}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Vendor */}
          <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '100ms' }}>
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <CardHeader icon={Building2} title="Assigned vendor" />
            <CardBody>
              {req.vendor_name ? (
                <>
                  <p className="font-semibold text-slate-900">{req.vendor_business_name}</p>
                  <p className="text-sm text-slate-500">{req.vendor_contact_name}</p>
                  {req.vendor_contact_phone && (
                    <p className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Phone className="w-4 h-4 text-slate-400" />{req.vendor_contact_phone}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">Not assigned yet</p>
                  {isActive && (
                    <Button size="sm" variant="secondary" icon={UserPlus} className="mt-3" onClick={() => setAssignOpen(true)}>
                      Assign vendor
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card className="animate-fade-up overflow-hidden" style={{ animationDelay: '140ms' }}>
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader icon={History} title="Status history" />
            <CardBody>
              <div className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-brand-300 before:via-slate-200 before:to-transparent">
                {(req.history || []).map((h, i) => (
                  <div key={h.id || i} className="relative pl-6">
                    <span className={cx(
                      'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-md',
                      i === req.history.length - 1 ? timelineTone(h.status) : 'bg-slate-300'
                    )} />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-[11px] text-slate-400">{fmtDateTime(h.created_at)}</span>
                    </div>
                    {h.note && <p className="text-sm text-slate-600 mt-1">{h.note}</p>}
                    {h.changed_by_name && <p className="text-xs text-slate-400 mt-0.5">by {h.changed_by_name}</p>}
                  </div>
                ))}
                {!req.history?.length && <p className="text-sm text-slate-400">No history</p>}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Assign modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign vendor" subtitle={req.ticket_no} icon={UserPlus}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={assign}>Assign</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vendor <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-xl border-0 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-500 transition appearance-none bg-no-repeat"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundPosition: 'right 0.6rem center',
                  backgroundSize: '1.1em',
                }}
              >
                <option value="">Select approved vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.business_name} — {v.city || 'any city'}{v.categories ? ` (${v.categories})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <Textarea label="Note" value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="Optional instruction for the vendor…" />
        </div>
      </Modal>

      {/* Status modal */}
      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Update status" subtitle={req.ticket_no} icon={Flag}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={updateStatus}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </Select>
          <Textarea label="Note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional note recorded in the timeline…" />
        </div>
      </Modal>

      {/* Escalate / close */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        title={confirm?.type === 'close' ? 'Close request' : 'Escalate to urgent'}
        icon={confirm?.type === 'close' ? XCircle : AlertOctagon}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm?.type === 'close' ? 'danger' : 'warning'} loading={saving} onClick={doConfirm}>
              {confirm?.type === 'close' ? 'Close request' : 'Escalate'}
            </Button>
          </>
        }
      >
        <Textarea
          label={confirm?.type === 'close' ? 'Closing note' : 'Escalation note'}
          value={confirm?.note || ''}
          onChange={(e) => setConfirm((c) => ({ ...c, note: e.target.value }))}
          placeholder={confirm?.type === 'close' ? 'Reason for closing…' : 'Why is this urgent?'}
        />
      </Modal>
    </>
  );
}
