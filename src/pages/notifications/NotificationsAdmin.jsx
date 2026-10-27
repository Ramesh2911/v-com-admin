import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BellRing, RotateCcw, Pencil, Send, Users, Hash,
  Building2, User, IdCard, Sparkles, Radio, Eye, MessageSquare,
  Megaphone, CheckCircle2, Clock,
} from 'lucide-react';
import { notificationsApi } from '../../api/endpoints';
import { getError } from '../../api/client';
import {
  Card, Button, EmptyState, Table, TH, TD, TRow,
  useToast, Modal, Input, Textarea, Badge,
  TableSkeleton, StatCard, Avatar,
} from '../../components/ui';
import { timeAgo, fmtDateTime, cx } from '../../lib/utils';

const AUDIENCES = [
  { v: '', label: 'All users', icon: Users },
  { v: 'customer', label: 'Customers', icon: User },
  { v: 'staff', label: 'Staff', icon: IdCard },
  { v: 'employee', label: 'Employees', icon: Building2 },
];

const TYPE_TONES = {
  in_app: 'violet',
  broadcast: 'brand',
  request: 'cyan',
  sos: 'rose',
  quotation: 'emerald',
  job: 'amber',
  property_enquiry: 'sky',
  support: 'indigo',
  leave: 'orange',
};

export default function NotificationsAdmin() {
  const toast = useToast();
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({ title_template: '', body_template: '', is_active: 1 });
  const [saving, setSaving] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', body: '', user_type: '' });
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([notificationsApi.templates(), notificationsApi.recent()])
      .then(([t, r]) => { setTemplates(t.data.data); setRecent(r.data.data); })
      .catch((e) => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await notificationsApi.updateTemplate(edit.id, form);
      toast.success('Template updated');
      setEdit(null); load();
    } catch (e) { toast.error(getError(e)); } finally { setSaving(false); }
  };

  const sendBroadcast = async () => {
    if (!broadcast.title) return toast.error('Title is required');
    setSending(true);
    try {
      const res = await notificationsApi.broadcast(broadcast);
      toast.success(res.data.message);
      setBroadcastOpen(false); setBroadcast({ title: '', body: '', user_type: '' }); load();
    } catch (e) { toast.error(getError(e)); } finally { setSending(false); }
  };

  const stats = useMemo(() => ({
    templates: templates.length,
    active: templates.filter((t) => t.is_active).length,
    sends: recent.length,
  }), [templates, recent]);

  return (
    <>
      {/* ============ Header ============ */}
      <div className="mb-6 animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
            <BellRing className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-ping" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" /> Engagement
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage templates and broadcast announcements</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={load}>Refresh</Button>
          <Button icon={Send} onClick={() => setBroadcastOpen(true)} className="btn-shine relative overflow-hidden">
            Broadcast
          </Button>
        </div>
      </div>

      {/* ============ Stats ============ */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={BellRing} label="Templates" value={stats.templates} tone="cyan" delay="0ms" />
        <StatCard icon={CheckCircle2} label="Active Templates" value={stats.active} tone="emerald" delay="60ms" />
        <StatCard icon={Megaphone} label="Recent Sends" value={stats.sends} tone="violet" delay="120ms" />
      </div>

      {/* ============ Tabs ============ */}
      <div className="mb-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {[
            { value: 'templates', label: 'Templates', count: templates.length, icon: BellRing },
            { value: 'recent', label: 'Recent sends', count: recent.length, icon: Clock },
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
                <t.icon className={cx('w-4 h-4', active ? 'text-blue-500' : 'text-slate-400')} />
                {t.label}
                <span className={cx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/80 text-slate-500'
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
        <Card className="animate-fade-up"><TableSkeleton rows={7} cols={5} /></Card>
      ) : tab === 'templates' ? (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900">Event templates</h3>
              <p className="text-sm text-slate-500">In-app notifications rendered with <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono text-violet-600">{'{{placeholders}}'}</code></p>
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <TH>Event</TH>
                <TH>Title template</TH>
                <TH>Body template</TH>
                <TH>Status</TH>
                <TH align="right">Actions</TH>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <TRow key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 ring-1 ring-blue-200 px-2 py-1 font-mono text-xs font-bold text-blue-700">
                      <Hash className="w-3 h-3" /> {t.event_code}
                    </span>
                  </TD>
                  <TD className="text-sm font-medium">{t.title_template}</TD>
                  <TD className="text-sm text-slate-500 max-w-[320px] truncate">{t.body_template || '—'}</TD>
                  <TD>
                    <Badge tone={t.is_active ? 'emerald' : 'slate'} dot className="font-bold">
                      {t.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </TD>
                  <TD align="right">
                    <Button size="icon" variant="ghost" title="Edit" onClick={() => { setForm({ title_template: t.title_template, body_template: t.body_template || '', is_active: t.is_active }); setEdit(t); }}><Pencil className="w-4 h-4" /></Button>
                  </TD>
                </TRow>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900">Recent notifications</h3>
              <p className="text-sm text-slate-500">{recent.length} latest in-app sends</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={BellRing} title="No notifications sent yet" message="Broadcasts and event notifications will appear here." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>User</TH>
                  <TH>Title</TH>
                  <TH className="hidden md:table-cell">Body</TH>
                  <TH>Type</TH>
                  <TH>When</TH>
                </tr>
              </thead>
              <tbody>
                {recent.map((n, i) => (
                  <TRow key={n.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={n.user_name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{n.user_name}</p>
                          <p className="text-xs text-slate-500 truncate">{n.user_email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-sm font-medium">{n.title}</TD>
                    <TD className="hidden md:table-cell text-sm text-slate-500 max-w-[300px] truncate">{n.body || '—'}</TD>
                    <TD>
                      <Badge tone={TYPE_TONES[n.type] || 'slate'} className="font-bold capitalize">
                        {n.type === 'broadcast' && <Megaphone className="w-3 h-3" />}
                        {n.type === 'in_app' && <BellRing className="w-3 h-3" />}
                        {n.type}
                      </Badge>
                    </TD>
                    <TD>
                      <p className="text-xs text-slate-500" title={fmtDateTime(n.created_at)}>{timeAgo(n.created_at)}</p>
                    </TD>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ============ Edit template modal ============ */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Edit ${edit?.event_code}`}
        subtitle="Notification template"
        icon={BellRing}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
            <Button loading={saving} onClick={save} icon={Pencil}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-violet-50 ring-1 ring-violet-100 p-3 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <p className="text-xs text-violet-800 leading-relaxed">
              Use <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">{'{{placeholders}}'}</code> matching the event data (e.g. <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">{'{{ticket_no}}'}</code>, <code className="bg-white px-1 py-0.5 rounded font-mono text-[11px]">{'{{name}}'}</code>) — they render when the notification fires.
            </p>
          </div>
          <Input label="Title template" value={form.title_template} onChange={(e) => setForm({ ...form, title_template: e.target.value })} icon={MessageSquare} />
          <Textarea label="Body template" value={form.body_template} onChange={(e) => setForm({ ...form, body_template: e.target.value })} />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit">
              {[
                { v: 1, label: 'Active', dot: 'bg-emerald-500' },
                { v: 0, label: 'Disabled', dot: 'bg-slate-400' },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setForm({ ...form, is_active: o.v })}
                  className={cx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150',
                    form.is_active === o.v ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <span className={cx('h-1.5 w-1.5 rounded-full', o.dot)} />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ============ Broadcast modal ============ */}
      <Modal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Broadcast notification"
        subtitle="Send an in-app message to users"
        icon={Megaphone}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button icon={Send} loading={sending} onClick={sendBroadcast} className="btn-shine relative overflow-hidden">Send</Button>
          </>
        }
      >
        <div className="grid md:grid-cols-2 gap-5">
          {/* Form */}
          <div className="space-y-4">
            <Input
              label="Title" required
              value={broadcast.title}
              onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
              placeholder="Announcement title…"
              icon={Megaphone}
            />
            <Textarea
              label="Message"
              value={broadcast.body}
              onChange={(e) => setBroadcast({ ...broadcast, body: e.target.value })}
              placeholder="Write the notification message…"
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Audience</label>
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
                {AUDIENCES.map((a) => {
                  const active = broadcast.user_type === a.v;
                  return (
                    <button
                      key={a.v || 'all'}
                      type="button"
                      onClick={() => setBroadcast({ ...broadcast, user_type: a.v })}
                      className={cx(
                        'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                        active ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <a.icon className={cx('w-3.5 h-3.5', active ? 'text-blue-500' : 'text-slate-400')} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live phone preview */}
          <div className="flex flex-col items-center justify-center">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Live preview
            </p>
            <div className="w-full max-w-[260px] rounded-[2rem] bg-slate-900 p-3 shadow-2xl shadow-slate-900/30 ring-4 ring-slate-800">
              {/* phone top */}
              <div className="flex justify-center mb-2">
                <div className="h-1.5 w-16 rounded-full bg-slate-700" />
              </div>
              <div className="rounded-2xl bg-slate-800/80 p-3 min-h-[140px]">
                {/* mock notification */}
                <div className="animate-fade-up rounded-xl bg-white/95 backdrop-blur p-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      <BellRing className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {broadcast.title || 'Your title here'}
                        </p>
                        <span className="text-[9px] text-slate-400 shrink-0">now</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-3">
                        {broadcast.body || 'Your message preview will appear here as users will see it on their device.'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] text-slate-500 mt-4">
                  Audience: <span className="font-semibold text-slate-300">
                    {AUDIENCES.find((a) => a.v === broadcast.user_type)?.label || 'All users'}
                  </span>
                </p>
              </div>
              {/* home indicator */}
              <div className="flex justify-center mt-2">
                <div className="h-1 w-20 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
