import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, Package, Heart, Award, ShieldCheck, Users, Leaf, MapPin, ArrowUpRight, Plus } from 'lucide-react';
import { api, query } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Page, QueryState, Go, useAction } from '../components/workspace';
import { Button, Card, Badge, Field, StatCard, Reveal, Avatar, Skeletons, ErrorState } from '../components/ui';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { number, tierFor } from '../lib/utils';

/* ─── Impact chart ─── */
function ImpactChart({ series }) {
  if (!series?.length) return null;
  return (
    <Card className="panel" style={{ padding: '24px 16px' }}>
      <span className="eyebrow" style={{ padding: '0 8px' }}><TrendingUp size={13} /> Meals served · last 30 days</span>
      <div style={{ height: 200, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="meals-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="15%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              labelFormatter={d => `Date: ${d}`}
            />
            <Area type="monotone" dataKey="meals" stroke="var(--primary)" strokeWidth={2} fill="url(#meals-grad)" name="Meals" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ─── Badge display ─── */
function BadgeTiers({ mealsServed }) {
  const tiers = [
    { name: 'Bronze', threshold: 1, icon: '○' },
    { name: 'Silver', threshold: 500, icon: '✧' },
    { name: 'Gold', threshold: 2000, icon: '★' },
    { name: 'Platinum', threshold: 5000, icon: '✦' },
  ];
  const current = tierFor(mealsServed);
  return (
    <Card className="panel stack">
      <span className="eyebrow"><Award size={13} /> Badge progress</span>
      <div className="tier-track">
        {tiers.map(tier => {
          const achieved = mealsServed >= tier.threshold;
          const isCurrent = tier.name === current;
          return (
            <div key={tier.name} className={`tier-step ${achieved ? 'achieved' : ''} ${isCurrent ? 'current-tier' : ''}`}>
              <span className="tier-icon">{tier.icon}</span>
              <strong>{tier.name}</strong>
              <span className="muted" style={{ fontSize: 10 }}>{tier.threshold.toLocaleString('en-IN')}+ meals</span>
              {isCurrent && <span className="tier-current-badge">Your tier</span>}
            </div>
          );
        })}
      </div>
      <div className="tier-next">
        {current !== 'Platinum' && (() => {
          const next = tiers.find(t => t.threshold > mealsServed);
          const remaining = next ? next.threshold - mealsServed : 0;
          return <p className="muted" style={{ fontSize: 12 }}>{remaining.toLocaleString('en-IN')} meals to <strong>{next?.name}</strong></p>;
        })()}
        {current === 'Platinum' && <p style={{ color: 'var(--saffron)', fontSize: 12 }}>✦ Platinum achieved! The highest honour.</p>}
      </div>
    </Card>
  );
}

/* ─── Shared Dashboard Body ─── */
function DashboardBody({ stats, myOrders }) {
  const mealsServed = stats?.meals || 0;
  const co2 = stats?.co2 || 0;
  const kg = stats?.kg || 0;
  const completed = stats?.completed || 0;

  return (
    <div className="stack">
      <div className="grid-4" style={{ marginBottom: 8 }}>
        <Reveal><StatCard label="Meals served" value={mealsServed} icon={Users} note="Verified by distribution proof" /></Reveal>
        <Reveal delay={0.05}><StatCard label="Food rescued" value={kg} unit="kg" icon={Package} note={`≈ ${number(co2)} kg CO₂ avoided`} /></Reveal>
        <Reveal delay={0.1}><StatCard label="CO₂ avoided" value={co2} unit="kg" icon={Leaf} note="Based on 2.5 kg CO₂ per kg food" /></Reveal>
        <Reveal delay={0.15}><StatCard label="Completed orders" value={completed} icon={ShieldCheck} note="Verified distributions" /></Reveal>
      </div>

      <ImpactChart series={stats?.series} />
      <BadgeTiers mealsServed={mealsServed} />

      {myOrders?.length > 0 && (
        <Card className="panel stack">
          <div className="between">
            <span className="eyebrow"><Heart size={13} /> Recent activity</span>
            <Go to="/orders">All orders</Go>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {myOrders.slice(0, 5).map(order => (
              <Reveal key={order._id}>
                <div className="activity-row">
                  <div className="activity-photo">
                    <img src={order.listing?.photos?.[0] || ''} alt={order.listing?.foodName} onError={e => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{order.listing?.foodName}</strong>
                    <br />
                    <small className="muted">{order.listing?.neighbourhood} · {order.listing?.servings} servings</small>
                  </div>
                  <Badge tone={order.status === 'Distributed' ? 'green' : order.status === 'Claimed' ? 'amber' : ''}>{order.status}</Badge>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/orders/${order._id}`}><ArrowUpRight size={14} /></Link>
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Demand form ─── */
function DemandForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', meals: 100, neededBy: '', neighbourhood: 'C-Scheme' });
  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = useAction(
    () => api('/demands', { method: 'POST', body: { ...form, meals: Number(form.meals), neededBy: new Date(form.neededBy).toISOString() } }),
    () => setOpen(false)
  );

  if (!open) return <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus size={14} /> New request</Button>;

  return (
    <form className="stack" onSubmit={e => { e.preventDefault(); submit.mutate(); }}>
      <Field label="What does your community need?">
        <input required minLength={5} maxLength={120} value={form.title} onChange={e => field('title', e.target.value)} placeholder="e.g. 200 meals for Sunday gathering" />
      </Field>
      <Field label="Details">
        <textarea required minLength={10} maxLength={1000} value={form.description} onChange={e => field('description', e.target.value)} />
      </Field>
      <div className="grid-2">
        <Field label="Meals needed">
          <input type="number" min={1} max={10000} required value={form.meals} onChange={e => field('meals', e.target.value)} />
        </Field>
        <Field label="Needed by">
          <input type="datetime-local" required value={form.neededBy} onChange={e => field('neededBy', e.target.value)} />
        </Field>
      </div>
      <Field label="Neighbourhood">
        <input required minLength={2} maxLength={80} value={form.neighbourhood} onChange={e => field('neighbourhood', e.target.value)} />
      </Field>
      <div className="row">
        <Button disabled={submit.isPending}>{submit.isPending ? 'Posting…' : 'Post request'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

/* ─── Donor Dashboard ─── */
export function DonorDashboard() {
  const stats = useQuery(query('my-stats', '/stats?mine=true'));
  const orders = useQuery(query('orders', '/orders'));

  return (
    <Page
      eyebrow="YOUR IMPACT"
      title={<>Your generosity.<br /><em>Measured in meals.</em></>}
      description="Every donation, completed order, and distribution proof tells your story."
      action={<Go to="/donate">Share food</Go>}
    >
      <QueryState query={stats}>
        {data => <DashboardBody stats={data} myOrders={orders.data || []} />}
      </QueryState>
    </Page>
  );
}

/* ─── NGO Dashboard ─── */
export function NgoDashboard() {
  const stats = useQuery(query('my-stats', '/stats?mine=true'));
  const orders = useQuery(query('orders', '/orders'));
  const demands = useQuery(query('demands', '/demands'));

  return (
    <Page
      eyebrow="YOUR IMPACT"
      title={<>Your community.<br /><em>Fed with care.</em></>}
      description="Track collections, manage demands, and see the difference your team makes."
      action={<Go to="/discover">Find food</Go>}
    >
      <QueryState query={stats}>
        {data => (
          <div className="stack">
            <DashboardBody stats={data} myOrders={orders.data || []} />
            <Card className="panel stack">
              <div className="between">
                <span className="eyebrow"><Package size={13} /> Demand requests</span>
                <DemandForm />
              </div>
              <QueryState query={demands} empty="Post a demand request to let donors know what you need.">
                {items => (
                  <div className="stack" style={{ gap: 12 }}>
                    {items.map(item => (
                      <div key={item._id} className="demand-row">
                        <div>
                          <strong>{item.title}</strong>
                          <br />
                          <small className="muted">{item.meals} meals · {item.neighbourhood} · by {new Date(item.neededBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
                        </div>
                        <Badge tone={item.status === 'fulfilled' ? 'green' : 'amber'}>{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </QueryState>
            </Card>
          </div>
        )}
      </QueryState>
    </Page>
  );
}
