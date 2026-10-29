import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ShieldX, Eye, Ban, UserCheck, FileText, AlertTriangle, Package, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { api, query, openPrivateFile } from '../lib/api';
import { Page, QueryState, useAction } from '../components/workspace';
import { Button, Card, Badge, Field, Avatar, Reveal, StatCard } from '../components/ui';
import { dateTime } from '../lib/utils';

const STATUS_TONE = { verified: 'green', pending: 'amber', rejected: 'red' };
const STATUS_ICON = { verified: ShieldCheck, pending: ShieldAlert, rejected: ShieldX };

/* ─── User card ─── */
function UserCard({ user, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const Icon = STATUS_ICON[user.verificationStatus] || ShieldAlert;

  const verify = useAction(
    (status) => api(`/admin/users/${user._id}`, { method: 'PATCH', body: { verificationStatus: status, reason: reason || undefined } }),
    onRefresh
  );
  const toggleBan = useAction(
    () => api(`/admin/users/${user._id}`, { method: 'PATCH', body: { banned: !user.banned, reason: reason || (user.banned ? 'Account restored.' : 'Account suspended.') } }),
    onRefresh
  );

  const profile = user.profile;
  const docs = profile?.documents || [];

  return (
    <Reveal>
      <Card className={`admin-user-card ${user.banned ? 'banned' : ''}`}>
        <div className="admin-user-header" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} aria-expanded={expanded}>
          <Avatar name={user.name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="between">
              <strong>{user.name}</strong>
              <div className="row" style={{ gap: 6 }}>
                <Badge tone={STATUS_TONE[user.verificationStatus]}>
                  <Icon size={11} /> {user.verificationStatus}
                </Badge>
                <Badge>{user.role}</Badge>
                {user.banned && <Badge tone="red"><Ban size={11} /> Banned</Badge>}
              </div>
            </div>
            <small className="muted">{user.email} · Joined {dateTime(user.createdAt)}</small>
          </div>
        </div>

        {expanded && (
          <div className="admin-user-detail stack">
            {/* Profile details */}
            {user.role === 'ngo' && profile && (
              <div className="admin-profile-info">
                <p><strong>Registration:</strong> {profile.registrationNumber}</p>
                <p><strong>Areas:</strong> {profile.areasServed?.join(', ')}</p>
                <p><strong>Capacity:</strong> {profile.capacity} meals/collection</p>
                <p><strong>Vehicle:</strong> {profile.hasVehicle ? 'Yes' : 'No'}</p>
                {profile.about && <p><strong>About:</strong> {profile.about}</p>}
              </div>
            )}
            {user.role === 'donor' && profile && (
              <div className="admin-profile-info">
                <p><strong>Type:</strong> {profile.donorType}</p>
                <p><strong>Business:</strong> {profile.businessName}</p>
                {profile.fssaiNumber && <p><strong>FSSAI:</strong> {profile.fssaiNumber}</p>}
                {profile.address && <p><strong>Address:</strong> {profile.address}</p>}
              </div>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <div className="stack" style={{ gap: 8 }}>
                <span className="eyebrow"><FileText size={12} /> Submitted documents ({docs.length})</span>
                {docs.map((doc, i) => (
                  <Button key={i} size="sm" variant="secondary" onClick={() => openPrivateFile(doc)}>
                    <Eye size={13} /> View document {i + 1}
                  </Button>
                ))}
              </div>
            )}
            {docs.length === 0 && user.verificationStatus === 'pending' && (
              <p className="muted" style={{ fontSize: 12 }}>No documents submitted yet.</p>
            )}

            {/* Reason + actions */}
            <Field label="Moderation note (optional)">
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for this action…" maxLength={500} />
            </Field>

            <div className="admin-actions">
              {user.verificationStatus !== 'verified' && (
                <Button size="sm" onClick={() => verify.mutate('verified')} disabled={verify.isPending || docs.length === 0}>
                  <UserCheck size={14} /> {verify.isPending ? 'Verifying…' : 'Verify'}
                </Button>
              )}
              {user.verificationStatus !== 'rejected' && (
                <Button size="sm" variant="secondary" onClick={() => verify.mutate('rejected')} disabled={verify.isPending}>
                  <XCircle size={14} /> Reject
                </Button>
              )}
              {user.verificationStatus !== 'pending' && (
                <Button size="sm" variant="ghost" onClick={() => verify.mutate('pending')} disabled={verify.isPending}>
                  Reset to pending
                </Button>
              )}
              <Button size="sm" variant={user.banned ? 'primary' : 'danger'} onClick={() => toggleBan.mutate()} disabled={toggleBan.isPending}>
                <Ban size={14} /> {user.banned ? 'Unban' : 'Ban'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Reveal>
  );
}

/* ─── Report card ─── */
function ReportCard({ report, onRefresh }) {
  const [resolution, setResolution] = useState('');
  const resolve = useAction(
    (status) => api(`/admin/reports/${report._id}`, { method: 'PATCH', body: { status, resolution: resolution || `Report ${status}.` } }),
    onRefresh
  );

  return (
    <Card className="admin-report-card panel">
      <div className="between">
        <Badge>{report.targetType}</Badge>
        <Badge tone={report.status === 'open' ? 'amber' : report.status === 'resolved' ? 'green' : ''}>{report.status}</Badge>
      </div>
      <p style={{ fontSize: 13 }}><strong>Reporter:</strong> {report.reporter?.name}</p>
      <p style={{ fontSize: 13 }}>{report.reason}</p>
      {report.target && (
        <small className="muted">
          Target: {report.target.name || report.target.foodName || report.target.maskedText || report.targetId}
        </small>
      )}
      {report.status === 'open' && (
        <div className="stack" style={{ gap: 8, marginTop: 12 }}>
          <Field label="Resolution note">
            <input value={resolution} onChange={e => setResolution(e.target.value)} placeholder="How was this resolved?" />
          </Field>
          <div className="row">
            <Button size="sm" onClick={() => resolve.mutate('resolved')} disabled={resolve.isPending || !resolution.trim()}>
              <CheckCircle size={13} /> Resolve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => resolve.mutate('dismissed')} disabled={resolve.isPending}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {report.resolution && <p className="muted" style={{ fontSize: 12 }}>Resolution: {report.resolution}</p>}
    </Card>
  );
}

/* ─── Admin Panel ─── */
export function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [filterStatus, setFilterStatus] = useState('');
  const users = useQuery(query('admin-users', '/admin/users'));
  const reports = useQuery(query('admin-reports', '/admin/reports'));
  const orders = useQuery(query('admin-orders', '/admin/orders'));
  const stats = useQuery(query('stats', '/stats'));

  const filtered = (users.data || []).filter(u =>
    !filterStatus || u.verificationStatus === filterStatus || (filterStatus === 'banned' && u.banned)
  );

  const pending = (users.data || []).filter(u => u.verificationStatus === 'pending').length;
  const openReports = (reports.data || []).filter(r => r.status === 'open').length;

  return (
    <Page
      eyebrow="ADMINISTRATION"
      title={<>Keep the table<br /><em>safe and open.</em></>}
      description="Verify organisations, moderate reports, and monitor platform activity."
    >
      {/* Quick stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <Reveal><StatCard label="Pending verifications" value={pending} icon={ShieldAlert} note="Accounts awaiting review" /></Reveal>
        <Reveal delay={0.05}><StatCard label="Open reports" value={openReports} icon={AlertTriangle} note="Flagged items to moderate" /></Reveal>
        <Reveal delay={0.1}><StatCard label="Total meals" value={stats.data?.meals || 0} icon={Package} note="Platform-wide impact" /></Reveal>
        <Reveal delay={0.15}><StatCard label="Active listings" value={stats.data?.active || 0} icon={ShieldCheck} note="Available right now" /></Reveal>
      </div>

      {/* Tab navigation */}
      <Card className="filters" style={{ marginBottom: 24 }}>
        <div className="between">
          <div className="segmented">
            {[
              { key: 'users', label: 'Users', icon: UserCheck, count: users.data?.length },
              { key: 'reports', label: 'Reports', icon: AlertTriangle, count: openReports },
              { key: 'orders', label: 'Orders', icon: Package, count: orders.data?.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <Button key={key} variant={tab === key ? 'primary' : 'ghost'} onClick={() => setTab(key)}>
                <Icon size={14} /> {label} {count != null && <Badge>{count}</Badge>}
              </Button>
            ))}
          </div>
          {tab === 'users' && (
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="banned">Banned</option>
            </select>
          )}
        </div>
      </Card>

      {/* Users tab */}
      {tab === 'users' && (
        <QueryState query={users} empty="No user accounts found.">
          {() => (
            <div className="stack" style={{ gap: 12 }}>
              <small className="muted">{filtered.length} accounts · {pending} pending verification</small>
              {filtered.map(u => (
                <UserCard key={u._id} user={u} onRefresh={() => users.refetch()} />
              ))}
            </div>
          )}
        </QueryState>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <QueryState query={reports} empty="No reports filed. A clean table.">
          {items => (
            <div className="grid-3">
              {items.map(r => (
                <ReportCard key={r._id} report={r} onRefresh={() => reports.refetch()} />
              ))}
            </div>
          )}
        </QueryState>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <QueryState query={orders} empty="No orders yet.">
          {items => (
            <div className="stack" style={{ gap: 8 }}>
              <small className="muted">{items.length} total orders</small>
              {items.slice(0, 50).map(order => (
                <Reveal key={order._id}>
                  <Card className="admin-order-row">
                    <div className="between">
                      <div>
                        <strong>{order.listing?.foodName || 'Donation'}</strong>
                        <br />
                        <small className="muted">
                          {order.listing?.neighbourhood} · {order.listing?.servings} servings · {dateTime(order.createdAt)}
                        </small>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <Badge tone={order.status === 'Distributed' ? 'green' : order.status === 'Expired' ? 'red' : 'amber'}>
                          {order.status}
                        </Badge>
                        <small className="muted">{order.donor?.name} → {order.ngo?.name}</small>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </QueryState>
      )}
    </Page>
  );
}
