import { useCallback, useEffect, useState } from 'react';
import {
  Banknote, Plus, RotateCcw, SearchX, CheckCircle2, Download,
  Clock, Wallet, TrendingUp, Building2, FileText,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { payoutsApi, vendorsApi, jobsApi } from '../../api/endpoints';
import api, { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Input, Textarea, ConfirmDialog, Badge, Select, StatCard,
} from '../../components/ui';
import { fmtMoney, fmtDate } from '../../lib/utils';

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
  rows: { style: { minHeight: '64px', '&:hover': { backgroundColor: 'rgba(16,185,129,0.05)' } } },
  table: { style: { fontFamily: 'inherit' } },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processed', label: 'Processed' },
];

export default function Payouts() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null); // payout to process
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const emptyForm = { vendor_id: '', amount: '', note: '', job_id: '' };
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      payoutsApi.list({ limit: 500 }),
      payoutsApi.summary().catch(() => null),
    ])
      .then(([list, sum]) => {
        setItems(list.data.data?.items || []);
        if (sum?.data?.data) setSummary(sum.data.data);
      })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  useEffect(() => {
    vendorsApi.list({ limit: 200 })
      .then((r) => setVendors(r.data.data?.items || r.data.data || []))
      .catch(() => {});
    jobsApi.list({ limit: 200 })
      .then((r) => setJobs(r.data.data?.items || r.data.data || []))
      .catch(() => {});
  }, []);

  const openModal = () => {
    setForm(emptyForm);
    setModal(true);
  };

  const save = async () => {
    const vendorId = Number(form.vendor_id);
    if (!vendorId) return toast.error('Vendor is required');
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return toast.error('Amount must be greater than 0');
    setSaving(true);
    try {
      const payload = {
        vendor_id: vendorId,
        amount,
        note: form.note.trim() || null,
      };
      if (form.job_id) payload.job_id = Number(form.job_id);
      await payoutsApi.create(payload);
      toast.success('Payout created');
      setModal(false);
      load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const doProcess = async () => {
    try {
      await payoutsApi.process(confirm.id);
      toast.success('Payout processed');
      setConfirm(null);
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/payouts/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vcom-payouts-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (e) { toast.error(getError(e)); } finally { setExporting(false); }
  };

  const term = q.trim().toLowerCase();
  const filtered = items.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (!term) return true;
    return `${p.vendor_name} ${p.job_no || ''} ${p.note || ''} #${p.id}`.toLowerCase().includes(term);
  });

  const vendorJobs = form.vendor_id
    ? jobs.filter((j) => Number(j.vendor_id) === Number(form.vendor_id))
    : [];

  const columns = [
    {
      name: 'Payout',
      selector: (r) => r.id,
      sortable: true,
      width: '90px',
      cell: (p) => (
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-300 ring-1 ring-slate-700">
          #{p.id}
        </span>
      ),
    },
    {
      name: 'Vendor',
      selector: (r) => r.vendor_name,
      sortable: true,
      grow: 2,
      cell: (p) => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {p.vendor_name}
          </p>
          <p className="text-xs text-slate-500 truncate">{p.note || '—'}</p>
        </div>
      ),
    },
    {
      name: 'Job',
      selector: (r) => r.job_no || '',
      width: '130px',
      cell: (p) => (p.job_no
        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"><FileText className="w-3.5 h-3.5" /> {p.job_no}</span>
        : <span className="text-xs text-slate-400">—</span>),
    },
    {
      name: 'Amount',
      selector: (r) => Number(r.amount),
      sortable: true,
      width: '130px',
      cell: (p) => <span className="font-display font-extrabold text-slate-900">{fmtMoney(Number(p.amount))}</span>,
    },
    {
      name: 'Status',
      selector: (r) => r.status,
      sortable: true,
      width: '120px',
      cell: (p) => (p.status === 'processed'
        ? <Badge tone="emerald" dot className="font-bold">Processed</Badge>
        : <Badge tone="amber" dot className="font-bold">Pending</Badge>),
    },
    {
      name: 'Dates',
      selector: (r) => r.created_at,
      sortable: true,
      width: '170px',
      cell: (p) => (
        <div className="text-xs">
          <p className="text-slate-600">Created {fmtDate(p.created_at)}</p>
          <p className="text-slate-400">{p.processed_at ? `Done ${fmtDate(p.processed_at)}` : 'Not processed'}</p>
        </div>
      ),
    },
    {
      name: '',
      right: true,
      width: '120px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      cell: (p) => (p.status === 'pending' ? (
        <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => setConfirm(p)}>Process</Button>
      ) : <span className="text-xs font-bold text-emerald-600">✓ Done</span>),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
            <Banknote className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3 h-3" /> Vendor payouts
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payouts</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manual payout entries — pending → processed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} loading={exporting} onClick={exportCsv}>Export CSV</Button>
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openModal}>New Payout</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Clock} label="Pending" value={fmtMoney(summary?.pending_amount || 0)}
          sub={`${summary?.pending_count || 0} entries`} tone="amber" delay="0ms"
        />
        <StatCard
          icon={CheckCircle2} label="Processed" value={fmtMoney(summary?.processed_amount || 0)}
          sub={`${summary?.processed_count || 0} entries`} tone="emerald" delay="60ms"
        />
        <StatCard icon={TrendingUp} label="Total payouts" value={fmtMoney(summary?.total_amount || 0)} tone="brand" delay="120ms" />
        <StatCard icon={Banknote} label="Entries" value={items.length} tone="cyan" delay="180ms" />
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
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Search vendor, job, note…" className="w-full sm:w-72" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No payouts"
              message="Create a manual payout entry for a vendor — it starts as Pending until processed."
              action={<Button icon={Plus} onClick={openModal}>New Payout</Button>}
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
              customStyles={tableStyles}
            />
          )}
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New payout"
        subtitle="Manual entry — vendor + amount, optional job link"
        icon={Banknote}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={Plus}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Vendor" required value={form.vendor_id}
            onChange={(e) => { set('vendor_id', e.target.value); set('job_id', ''); }}
          >
            <option value="">Select vendor…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.business_name}</option>
            ))}
          </Select>
          <Input
            label="Amount (₹)" required type="number" min="0.01" step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="e.g. 1500.00" icon={Banknote}
          />
          <Select
            label="Link job (optional)" value={form.job_id}
            onChange={(e) => set('job_id', e.target.value)}
          >
            <option value="">No job</option>
            {vendorJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.job_no || `Job #${j.id}`} — {j.request_title || j.title || ''}
              </option>
            ))}
          </Select>
          {form.vendor_id && vendorJobs.length === 0 && (
            <p className="text-[11px] text-slate-400 -mt-2">No jobs found for this vendor.</p>
          )}
          <Textarea
            label="Note" value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="e.g. September settlement"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doProcess}
        title="Process payout?"
        message={`Mark ${fmtMoney(Number(confirm?.amount || 0))} to ${confirm?.vendor_name || 'vendor'} as processed? This cannot be undone.`}
        confirmText="Process"
      />
    </>
  );
}
