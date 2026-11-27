import { useCallback, useEffect, useState } from 'react';
import { Truck, RotateCcw, SearchX, Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { scrapApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, SearchInput,
  useToast, Modal, Badge, Input, ConfirmDialog, Select, StatCard,
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
  rows: { style: { minHeight: '64px', '&:hover': { backgroundColor: 'rgba(56,189,248,0.05)' } } },
  table: { style: { fontFamily: 'inherit' } },
};

export default function ScrapBuyers() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | {id?, ...form}
  const [form, setForm] = useState({ name: '', phone: '', vehicle_no: '', scale_type: '', status: 'active' });
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    scrapApi.buyers()
      .then((r) => setItems(r.data.data || []))
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const openCreate = () => {
    setForm({ name: '', phone: '', vehicle_no: '', scale_type: '', status: 'active' });
    setModal({});
  };

  const openEdit = (b) => {
    setForm({ name: b.name || '', phone: b.phone || '', vehicle_no: b.vehicle_no || '', scale_type: b.scale_type || '', status: b.status || 'active' });
    setModal({ id: b.id });
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      if (modal?.id) {
        await scrapApi.updateBuyer(modal.id, form);
        toast.success('Buyer updated');
      } else {
        await scrapApi.createBuyer(form);
        toast.success('Buyer created');
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
    setSaving(true);
    try {
      await scrapApi.deleteBuyer(del.id);
      toast.success('Buyer deleted');
      setDel(null);
      load();
    } catch (e) {
      toast.error(getError(e));
      setDel(null);
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((b) => {
    const s = q.toLowerCase();
    return !q || (b.name || '').toLowerCase().includes(s)
      || (b.phone || '').toLowerCase().includes(s)
      || (b.vehicle_no || '').toLowerCase().includes(s);
  });

  const activeCount = items.filter((b) => b.status === 'active').length;
  const assignedTotal = items.reduce((n, b) => n + (Number(b.assigned_requests) || 0), 0);

  const columns = [
    {
      name: 'Buyer',
      selector: (b) => b.name,
      sortable: true,
      minWidth: '190px',
      cell: (b) => (
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-teal-500/25 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{b.name}</p>
            <p className="text-xs text-slate-500">{b.phone}</p>
          </div>
        </div>
      ),
    },
    {
      name: 'Vehicle / Scale',
      selector: (b) => b.vehicle_no || '',
      sortable: true,
      minWidth: '190px',
      cell: (b) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{b.vehicle_no || '—'}</p>
          <p className="text-xs text-slate-500 truncate">{b.scale_type || '—'}</p>
        </div>
      ),
    },
    {
      name: 'Assigned',
      selector: (b) => Number(b.assigned_requests) || 0,
      sortable: true,
      width: '110px',
      cell: (b) => <span className="text-sm font-bold text-slate-700">{b.assigned_requests ?? 0} req.</span>,
    },
    {
      name: 'Status',
      selector: (b) => b.status,
      sortable: true,
      width: '120px',
      cell: (b) => <Badge tone={b.status === 'active' ? 'emerald' : 'slate'} dot className="font-bold">{b.status}</Badge>,
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
          <Button size="icon" variant="ghost" title="Edit buyer" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" title="Delete buyer" disabled={(Number(b.assigned_requests) || 0) > 0} onClick={() => setDel(b)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 shadow-lg shadow-cyan-500/30 flex items-center justify-center shrink-0">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="w-3 h-3" /> Scrap collection team
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Scrap Buyers</h1>
            <p className="text-sm text-slate-500 mt-0.5">Buyers assigned to doorstep pickups</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Plus} onClick={openCreate}>Add buyer</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Truck} label="Total buyers" value={items.length} tone="brand" delay="0ms" />
        <StatCard icon={Plus} label="Active buyers" value={activeCount} tone="emerald" delay="60ms" />
        <StatCard icon={Ticket} label="Assigned requests" value={assignedTotal} tone="cyan" delay="120ms" />
      </div>

      {loading ? (
        <Card className="animate-fade-up">
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Buyers</h3>
                <p className="text-sm text-slate-500">{filtered.length} of {items.length} buyers</p>
              </div>
            </div>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No buyers yet"
              message="Add scrap buyers who collect doorstep pickups."
              action={<Button icon={Plus} onClick={openCreate}>Add buyer</Button>}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25]}
              highlightOnHover
              pointerOnHover
              subHeader
              subHeaderComponent={
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {filtered.length} of {items.length} shown
                  </p>
                  <SearchInput value={q} onChange={setQ} placeholder="Name / phone / vehicle…" className="w-full sm:w-64" />
                </div>
              }
              noDataComponent={
                <div className="py-12 text-center">
                  <SearchX className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No buyers match your search</p>
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit buyer' : 'Add buyer'} size="sm">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Suresh Gowda" required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile" required />
          <Input label="Vehicle number" value={form.vehicle_no} onChange={(e) => setForm((f) => ({ ...f, vehicle_no: e.target.value }))} placeholder="KA-19-E-4421" />
          <Input label="Weighing scale type" value={form.scale_type} onChange={(e) => setForm((f) => ({ ...f, scale_type: e.target.value }))} placeholder="Digital Weighing Scale" />
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{modal?.id ? 'Save changes' : 'Create buyer'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        title="Delete buyer?"
        message={`"${del?.name}" will be permanently removed. Buyers with assigned requests cannot be deleted.`}
        confirmText="Delete"
        tone="danger"
        loading={saving}
      />
    </>
  );
}
