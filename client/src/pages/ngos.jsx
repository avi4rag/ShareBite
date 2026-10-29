import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, Truck, ShieldCheck, Star, Search, Filter, ArrowUpRight } from 'lucide-react';
import { query } from '../lib/api';
import { Page, QueryState, Go } from '../components/workspace';
import { Button, Card, Badge, Field, Avatar, Reveal } from '../components/ui';
import { number } from '../lib/utils';

/* ─── NGO Card in directory ─── */
function NgoCard({ ngo }) {
  const rating = ngo.rating ? ngo.rating.toFixed(1) : null;
  return (
    <Reveal>
      <Card className="ngo-dir-card panel">
        <div className="between">
          <Avatar name={ngo.user?.name} size={54} />
          <div style={{ textAlign: 'right' }}>
            <Badge tone="green"><ShieldCheck size={12} /> Verified</Badge>
            {rating && (
              <div className="star-row">
                <Star size={12} fill="var(--saffron)" stroke="none" />
                <span style={{ fontSize: 12 }}>{rating} ({ngo.reviewCount})</span>
              </div>
            )}
          </div>
        </div>
        <h3>{ngo.user?.name}</h3>
        <p className="muted" style={{ fontSize: 13, WebkitLineClamp: 3, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
          {ngo.about}
        </p>
        <div className="ngo-meta">
          <span><MapPin size={13} />{ngo.areasServed?.slice(0, 2).join(', ')}</span>
          <span><Users size={13} />{ngo.capacity} capacity</span>
          {ngo.hasVehicle && <span><Truck size={13} />Has vehicle</span>}
        </div>
        <div className="between ngo-card-footer">
          <div>
            <strong style={{ fontFamily: 'Fraunces, serif', fontSize: 22 }}>{number(ngo.peopleFed)}</strong>
            <span className="muted" style={{ fontSize: 10, marginLeft: 6 }}>people fed</span>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link to={`/ngos/${ngo.user?._id}`}>
              View profile <ArrowUpRight size={13} />
            </Link>
          </Button>
        </div>
      </Card>
    </Reveal>
  );
}

/* ─── NGO Profile page ─── */
export function NgoProfile() {
  const { userId } = useParams();
  const ngo = useQuery(query(['ngo', userId], `/ngos/${userId}`));

  return (
    <div className="container workspace">
      <QueryState query={ngo}>
        {data => (
          <>
            <div className="page-heading between">
              <div>
                <span className="eyebrow">COMMUNITY ORGANISATION</span>
                <h1>{data.user?.name}</h1>
                <div className="row" style={{ marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
                  <Badge tone="green"><ShieldCheck size={13} /> Verified</Badge>
                  {data.rating && (
                    <span className="row" style={{ gap: 5, fontSize: 13 }}>
                      <Star size={14} fill="var(--saffron)" stroke="none" />
                      {data.rating.toFixed(1)} out of 5 ({data.reviewCount} reviews)
                    </span>
                  )}
                  {data.hasVehicle && <Badge><Truck size={12} /> Has collection vehicle</Badge>}
                </div>
              </div>
              <Avatar name={data.user?.name} size={80} />
            </div>

            <div className="detail-grid">
              {/* Left */}
              <div className="stack">
                <Card className="panel stack">
                  <span className="eyebrow">About</span>
                  <p>{data.about}</p>
                </Card>

                <Card className="panel stack">
                  <span className="eyebrow">Areas served</span>
                  <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {data.areasServed?.map(area => (
                      <Badge key={area}><MapPin size={11} />{area}</Badge>
                    ))}
                  </div>
                </Card>

                {data.reviews?.length > 0 && (
                  <Card className="panel stack">
                    <span className="eyebrow"><Star size={13} /> Community feedback</span>
                    {data.reviews.slice(0, 5).map((review, i) => (
                      <div key={i} className="review-item">
                        <div className="between">
                          <strong style={{ fontSize: 13 }}>{review.reviewer?.name}</strong>
                          <div className="star-row">
                            {Array.from({ length: 5 }, (_, j) => (
                              <Star key={j} size={12} fill={j < review.rating ? 'var(--saffron)' : 'none'} stroke={j < review.rating ? 'none' : 'currentColor'} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, marginTop: 6 }}>{review.text}</p>
                      </div>
                    ))}
                  </Card>
                )}
              </div>

              {/* Right */}
              <div className="stack">
                <Card className="panel stack">
                  <span className="eyebrow">Impact</span>
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 56, lineHeight: 1 }}>{number(data.peopleFed)}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>people fed through ShareBite</div>
                  </div>
                  <div className="grid-2">
                    <div className="stat-mini">
                      <strong>{data.capacity}</strong>
                      <span className="muted">capacity/collection</span>
                    </div>
                    <div className="stat-mini">
                      <strong>{data.areasServed?.length}</strong>
                      <span className="muted">areas served</span>
                    </div>
                  </div>
                </Card>

                <Card className="panel stack">
                  <span className="eyebrow">Registration</span>
                  <p style={{ fontSize: 13 }}>Reg. No: <code>{data.registrationNumber}</code></p>
                  <p className="muted" style={{ fontSize: 12 }}>This organisation is verified by the ShareBite admin team.</p>
                </Card>

                <Button asChild>
                  <Link to="/discover">Browse food for this NGO <ArrowUpRight size={14} /></Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}

/* ─── NGO Directory ─── */
export function NgoDirectory() {
  const [filters, setFilters] = useState({ search: '', vehicle: '', capacity: '' });
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  const ngos = useQuery(query(['ngos', params.toString()], `/ngos?${params}`));

  return (
    <Page
      eyebrow="COMMUNITY PARTNERS"
      title={<>The hands<br /><em>behind the hope.</em></>}
      description="Every verified organisation here works tirelessly to bring food from kitchens to communities across Jaipur."
    >
      <Card className="filters">
        <div className="row" style={{ flexWrap: 'wrap', gap: 16 }}>
          <Field label="Search organisations">
            <div className="input-icon-wrap">
              <Search size={14} className="input-icon" />
              <input
                value={filters.search}
                type="search"
                placeholder="Name or area…"
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </Field>
          <Field label="Minimum capacity">
            <input
              type="number"
              min={0}
              value={filters.capacity}
              onChange={e => setFilters(f => ({ ...f, capacity: e.target.value }))}
              placeholder="Any"
            />
          </Field>
          <Field label="Has vehicle">
            <select value={filters.vehicle} onChange={e => setFilters(f => ({ ...f, vehicle: e.target.value }))}>
              <option value="">Any</option>
              <option value="true">With vehicle only</option>
            </select>
          </Field>
          <Button variant="ghost" size="sm" style={{ alignSelf: 'flex-end' }} onClick={() => setFilters({ search: '', vehicle: '', capacity: '' })}>
            Clear
          </Button>
        </div>
      </Card>

      <div className="between section-label">
        <strong>{ngos.data?.length ?? '…'} verified organisations in Jaipur</strong>
      </div>

      <QueryState query={ngos} empty="No organisations match your filters.">
        {items => (
          <div className="grid-3">
            {items.map(ngo => <NgoCard key={ngo._id} ngo={ngo} />)}
          </div>
        )}
      </QueryState>
    </Page>
  );
}
