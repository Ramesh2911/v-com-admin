import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, PauseCircle, MapPin, Phone, Mail,
  Briefcase, Star, Wrench, CalendarDays, Building2,
} from 'lucide-react';
import { vendorsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, CardHeader, CardBody, Button, StatusBadge, PageLoader, Avatar,
  InfoRow, useToast, ConfirmDialog, Table, TH, TD, TRow, Badge, EmptyState,
  Modal, Input, Select,
} from '../../components/ui';
import { fmtDate, fmtMoney, labelize, timeAgo, cx } from '../../lib/utils';

const STATUS_DOT = {
  pending: 'bg-amber-400',
  approved: 'bg-emerald-400',
  suspended: 'bg-slate-300',
  rejected: 'bg-rose-400',
};

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('approved');

  const load = () => {
    setLoading(true);
    vendorsApi
      .get(id)
      .then((res) => {
        setVendor(res.data.data);
        setNewStatus(res.data.data.status);
      })
      .catch((err) => toast.error(getError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async () => {
    try {
      await vendorsApi.approve(id);
      toast.success('Vendor approved');
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const reject = async () => {
    try {
      await vendorsApi.reject(id, rejectReason);
      toast.success('Vendor rejected');
      setRejectOpen(false);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const updateStatus = async () => {
    try {
      await vendorsApi.setStatus(id, newStatus);
      toast.success('Status updated');
      setStatusOpen(false);
      load();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  if (loading) return <PageLoader />;
  if (!vendor) return <EmptyState title="Vendor not found" />;

  const rating = Number(vendor.rating || 0);

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/vendors')}
            className="h-11 w-11 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:ring-slate-300 hover:-translate-x-0.5 transition-all shrink-0"
            title="Back to vendors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <button
              onClick={() => navigate('/vendors')}
              className="text-xs font-semibold text-violet-600 uppercase tracking-wider hover:text-violet-700 transition-colors"
            >
              Vendors
            </button>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
              {vendor.business_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              {vendor.contact_person || vendor.name}
              {vendor.city && <> · <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vendor.city}</span></>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {vendor.status === 'pending' && (
            <>
              <Button variant="success" icon={CheckCircle2} onClick={() => setConfirm('approve')}>Approve</Button>
              <Button variant="danger" icon={XCircle} onClick={() => setRejectOpen(true)}>Reject</Button>
            </>
          )}
          {vendor.status !== 'pending' && (
            <Button variant="secondary" icon={PauseCircle} onClick={() => setStatusOpen(true)}>Change status</Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============ Profile card ============ */}
        <Card className="overflow-hidden animate-fade-up">
          <div className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-black px-5 pt-6 pb-10 text-white overflow-hidden">
            <div className="absolute -top-14 -right-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl animate-drift pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl animate-drift-slow pointer-events-none" />
            <div className="absolute inset-0 grid-overlay opacity-[0.05] pointer-events-none" />

            <div className="relative flex flex-col items-center text-center">
              <Avatar name={vendor.business_name} src={vendor.logo} size="lg" />
              <h2 className="font-display font-bold text-lg text-white mt-3 leading-tight">{vendor.business_name}</h2>
              <p className="text-sm text-slate-300/90 mt-0.5">{vendor.contact_person || vendor.name}</p>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white mt-3">
                <span className={cx('h-1.5 w-1.5 rounded-full', STATUS_DOT[vendor.status] || 'bg-slate-300')} />
                {labelize(vendor.status)}
              </span>

              <div className="flex items-center justify-center gap-0.5 mt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cx('w-4 h-4', n <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-white/20')}
                  />
                ))}
                <span className="ml-1.5 text-xs font-bold text-amber-300">{rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <CardBody className="px-5 pb-5">
            {/* pull-up stats */}
            <div className="grid grid-cols-2 gap-3 -mt-8 relative z-10 mb-1">
              <div className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-lg p-4 text-center">
                <div className="h-9 w-9 mx-auto rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-md shadow-brand-500/25 mb-2">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-display font-extrabold text-slate-900">{vendor.total_jobs ?? 0}</p>
                <p className="text-xs text-slate-500">Total jobs</p>
              </div>
              <div className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] shadow-lg p-4 text-center">
                <div className="h-9 w-9 mx-auto rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 mb-2">
                  <Star className="w-4 h-4 text-white fill-current" />
                </div>
                <p className="text-xl font-display font-extrabold text-slate-900">{rating.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joined</p>
                <p className="text-sm font-bold text-slate-800">{fmtDate(vendor.created_at, 'DD MMM YY')}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved</p>
                <p className="text-sm font-bold text-slate-800">
                  {vendor.approved_at ? fmtDate(vendor.approved_at, 'DD MMM YY') : '—'}
                </p>
              </div>
            </div>

            {vendor.rejection_reason && (
              <div className="mt-4 rounded-xl bg-rose-50 ring-1 ring-rose-200 p-3.5">
                <p className="text-xs font-bold text-rose-700">Rejection reason</p>
                <p className="text-sm text-rose-800 mt-0.5">{vendor.rejection_reason}</p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <CalendarDays className="w-3.5 h-3.5" />
              Joined {timeAgo(vendor.created_at)}
            </div>
          </CardBody>
        </Card>

        {/* ============ Details ============ */}
        <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <CardHeader icon={Building2} title="Business details" />
          <CardBody>
            <div className="grid sm:grid-cols-2 gap-x-8">
              <InfoRow label="Owner" value={vendor.name} />
              <InfoRow label="Email" value={<span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{vendor.email}</span>} />
              <InfoRow label="Phone" value={<span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{vendor.phone}</span>} />
              <InfoRow label="City" value={<span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{vendor.city || '—'}</span>} />
              <InfoRow label="State" value={vendor.state} />
              <InfoRow label="Pincode" value={vendor.pincode} />
              <InfoRow label="Coverage" value={vendor.coverage_areas} />
              <InfoRow label="GST" value={vendor.gst_number} />
              <InfoRow label="Address" value={vendor.address} />
              <InfoRow label="Joined" value={fmtDate(vendor.created_at)} />
              {vendor.approved_at && <InfoRow label="Approved" value={fmtDate(vendor.approved_at)} />}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Service categories</p>
            <div className="flex flex-wrap gap-2">
              {vendor.categories?.length ? (
                vendor.categories.map((c) => (
                  <Badge
                    key={c.id}
                    tone="brand"
                    className="hover:ring-brand-300 hover:shadow-sm transition-all duration-150"
                  >
                    {c.name} <span className="text-brand-400 font-normal">· {c.module_name}</span>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-slate-400">No categories assigned</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* ============ Recent jobs ============ */}
        <Card className="lg:col-span-3 animate-fade-up overflow-hidden" style={{ animationDelay: '180ms' }}>
          <CardHeader icon={Wrench} title="Recent jobs" subtitle="Latest work orders" />
          {!vendor.recent_jobs?.length ? (
            <EmptyState title="No jobs yet" message="Jobs appear here once work is assigned." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>Job</TH>
                  <TH>Request</TH>
                  <TH>Stage</TH>
                  <TH className="hidden sm:table-cell">Schedule</TH>
                  <TH align="right">Amount</TH>
                </tr>
              </thead>
              <tbody>
                {vendor.recent_jobs.map((j) => (
                  <TRow key={j.id}>
                    <TD>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500/10 to-violet-500/10 ring-1 ring-brand-500/15 flex items-center justify-center">
                          <Wrench className="w-3.5 h-3.5 text-brand-600" />
                        </span>
                        <span className="font-mono font-semibold text-slate-900">{j.job_no}</span>
                      </span>
                    </TD>
                    <TD>
                      <p className="text-sm font-medium text-slate-800">{j.title}</p>
                      <p className="text-xs text-slate-500 font-mono">{j.ticket_no}</p>
                    </TD>
                    <TD><StatusBadge status={j.stage} /></TD>
                    <TD className="hidden sm:table-cell text-slate-500">{fmtDate(j.schedule_date)}</TD>
                    <TD align="right" className="font-bold text-emerald-600">{fmtMoney(j.amount)}</TD>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === 'approve'}
        onClose={() => setConfirm(null)}
        onConfirm={approve}
        title="Approve vendor?"
        message={`${vendor.business_name} will be able to receive assignments and submit quotations.`}
        confirmText="Approve"
        tone="success"
      />

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject vendor" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={reject}>Reject</Button>
          </>
        }
      >
        <Input label="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Did not meet criteria…" />
      </Modal>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Change vendor status" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={updateStatus}>Update</Button>
          </>
        }
      >
        <Select label="Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Modal>
    </>
  );
}
