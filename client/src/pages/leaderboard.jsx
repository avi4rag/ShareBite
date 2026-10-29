import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Trophy, Medal, Crown, TrendingUp, Calendar, Download, Share2, ArrowUpRight, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api, query } from '../lib/api';
import { Page, QueryState, useAction } from '../components/workspace';
import { Button, Card, Badge, Reveal, CountUp, Avatar, Skeletons } from '../components/ui';
import { Podium } from '../components/podium';
import { number, tierFor } from '../lib/utils';

const TIER_COLORS = { Platinum: 'badge-amber', Gold: 'badge-amber', Silver: '', Bronze: '' };
const TIER_ICONS = { Platinum: '✦', Gold: '★', Silver: '✧', Bronze: '○' };

function LeaderRow({ entry, rank }) {
  const tier = tierFor(entry.mealsServed);
  return (
    <Reveal delay={rank * 0.04} className={`leaderboard-row ${rank <= 3 ? 'top-three' : ''}`}>
      <span className={`rank-badge ${rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : ''}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </span>
      <Avatar name={entry.name} size={40} />
      <div className="leader-name">
        <strong>{entry.name}</strong>
        <span className="muted" style={{ fontSize: 11 }}>{entry.donations} donations</span>
      </div>
      <Badge className={TIER_COLORS[tier]}>
        {TIER_ICONS[tier]} {tier}
      </Badge>
      <div className="leader-meals">
        <strong><CountUp value={entry.mealsServed} /></strong>
        <span className="muted" style={{ fontSize: 10 }}>meals served</span>
      </div>
    </Reveal>
  );
}

/* ─── Certificate card ─── */
function CertificateCard({ cert }) {
  const tier = cert.tier;
  const download = useAction(
    async () => {
      // Dynamically import to avoid bundle bloat
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, 561] });

      // Background
      doc.setFillColor(251, 248, 243);
      doc.rect(0, 0, 794, 561, 'F');

      // Forest border
      doc.setDrawColor(36, 77, 62);
      doc.setLineWidth(12);
      doc.rect(20, 20, 754, 521);
      doc.setLineWidth(2);
      doc.rect(30, 30, 734, 501);

      // Saffron seal circle
      doc.setFillColor(232, 173, 73);
      doc.circle(397, 100, 40, 'F');
      doc.setTextColor(36, 77, 62);
      doc.setFontSize(24);
      doc.text('✦', 390, 108);

      // Title
      doc.setTextColor(36, 77, 62);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF HONOR', 397, 165, { align: 'center' });

      doc.setFontSize(28);
      doc.setFont('helvetica', 'normal');
      doc.text('ShareBite', 397, 200, { align: 'center' });

      doc.setFontSize(13);
      doc.text('This certificate recognises the generous contribution of', 397, 240, { align: 'center' });

      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(cert.user?.name || 'Our Donor', 397, 278, { align: 'center' });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text(`who has helped serve ${number(cert.mealsServed)} meals to families in need.`, 397, 310, { align: 'center' });

      doc.setFontSize(11);
      doc.text(`Tier: ${tier} · Certificate ID: ${cert.certId}`, 397, 350, { align: 'center' });
      doc.text(`Issued: ${new Date(cert.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 397, 370, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(101, 115, 105);
      doc.text('Verified at ' + window.location.origin + '/certificates/' + cert.certId, 397, 510, { align: 'center' });

      doc.save(`ShareBite-Certificate-${cert.certId}.pdf`);
    },
    null
  );

  return (
    <Card className="certificate-card panel">
      <div className="cert-header">
        <div className="cert-seal">
          <Leaf size={22} />
        </div>
        <div>
          <span className="eyebrow">Certificate of Honor</span>
          <h3>{tier} Tier</h3>
        </div>
        <Badge className={TIER_COLORS[tier]}>{TIER_ICONS[tier]} {tier}</Badge>
      </div>
      <div className="cert-stats">
        <div>
          <strong style={{ fontFamily: 'Fraunces, serif', fontSize: 34 }}>{number(cert.mealsServed)}</strong>
          <span className="muted" style={{ fontSize: 11 }}>meals served</span>
        </div>
        <div>
          <small className="muted">ID: {cert.certId}</small>
          <small className="muted">Issued {new Date(cert.issuedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</small>
        </div>
      </div>
      <div className="cert-actions">
        <Button size="sm" variant="secondary" onClick={() => download.mutate()} disabled={download.isPending}>
          <Download size={14} /> {download.isPending ? 'Generating…' : 'Download PDF'}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/certificates/${cert.certId}`}>
            <Share2 size={14} /> Public link
          </Link>
        </Button>
      </div>
    </Card>
  );
}

/* ─── Public certificate page ─── */
export function CertificatePage() {
  const { certId } = useParams();
  const cert = useQuery(query(['cert', certId], `/certificates/${certId}`));

  return (
    <div className="container section">
      <div className="page-heading" style={{ textAlign: 'center' }}>
        <span className="eyebrow">ShareBite · Certificate of Honor</span>
        <h1>A little recognition<br /><em>for a lot of good.</em></h1>
      </div>
      <QueryState query={cert}>
        {data => (
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <CertificateCard cert={data} />
            <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 12 }}>
              This certificate is publicly verifiable. The meals figure is backed by distribution proofs submitted on ShareBite.
            </p>
          </div>
        )}
      </QueryState>
    </div>
  );
}

/* ─── Leaderboard Page ─── */
export function Leaderboard() {
  const { user } = useAuth();
  const [role, setRole] = useState('donor');
  const [period, setPeriod] = useState('all');
  const leaders = useQuery(query(['leaderboard', role, period], `/leaderboard?role=${role}&period=${period}`));
  const myCerts = useQuery(query('my-certs', '/certificates/mine', { enabled: !!user }));

  const issueNewCert = useAction(
    () => api('/certificates', { method: 'POST' }),
    () => { myCerts.refetch(); }
  );

  return (
    <Page
      eyebrow="THE HONOUR BOARD"
      title={<>Good people.<br /><em>Remarkable numbers.</em></>}
      description="Every position here represents real meals that reached real people. Ranked by verified distribution, not donation count."
    >
      {/* My certificates */}
      {user && user.role !== 'admin' && (
        <div style={{ marginBottom: 48 }}>
          <div className="between section-label">
            <strong>Your certificates</strong>
            <Button size="sm" variant="secondary" onClick={() => issueNewCert.mutate()} disabled={issueNewCert.isPending}>
              {issueNewCert.isPending ? 'Checking…' : 'Update my certificate'}
            </Button>
          </div>
          <QueryState query={myCerts} empty="Your first certificate arrives after a completed distribution.">
            {certs => (
              <div className="grid-3">
                {certs.map(cert => <CertificateCard key={cert._id} cert={{ ...cert, user }} />)}
              </div>
            )}
          </QueryState>
        </div>
      )}

      {/* Leaderboard tabs */}
      <Card className="filters" style={{ marginBottom: 32 }}>
        <div className="between">
          <div className="segmented">
            <Button variant={role === 'donor' ? 'primary' : 'ghost'} onClick={() => setRole('donor')}>
              <Trophy size={15} /> Donors
            </Button>
            <Button variant={role === 'ngo' ? 'primary' : 'ghost'} onClick={() => setRole('ngo')}>
              <Medal size={15} /> NGOs
            </Button>
          </div>
          <div className="segmented">
            <Button variant={period === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setPeriod('all')}>
              <TrendingUp size={13} /> All time
            </Button>
            <Button variant={period === 'month' ? 'primary' : 'ghost'} size="sm" onClick={() => setPeriod('month')}>
              <Calendar size={13} /> This month
            </Button>
          </div>
        </div>
      </Card>

      <QueryState query={leaders} empty="Be the first on the board — complete a distribution to be counted.">
        {entries => (
          <div className="stack">
            {/* Top 3 podium */}
            {entries.length >= 3 && (
              <div style={{ marginBottom: 48 }}>
                <div className="section-label" style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Crown size={18} /> Top three contributors
                </div>
                <Podium entries={entries.slice(0, 3)} />
              </div>
            )}

            {/* Full list */}
            <div className="leaderboard-list">
              {entries.map((entry, i) => (
                <LeaderRow key={entry._id} entry={entry} rank={i + 1} />
              ))}
            </div>

            {entries.length > 10 && (
              <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 16 }}>
                Showing {entries.length} contributors · Ranked by verified meals served
              </p>
            )}
          </div>
        )}
      </QueryState>
    </Page>
  );
}
