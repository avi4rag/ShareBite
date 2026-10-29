import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Package, Truck, CheckCircle, Star, Camera, ArrowLeft, Send, ShieldAlert, AlertCircle, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { api, query, uploadFile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Page, QueryState, useAction, celebrate } from '../components/workspace';
import { Button, Card, Field, Badge, FoodImage, StatusTimeline, ChatBubble, CountdownRing, Avatar } from '../components/ui';
import { UploadField } from '../components/upload-field';
import { dateTime } from '../lib/utils';

/* ─── Order card in list ─── */
function OrderCard({ order }) {
  const isActive = !['Distributed', 'Expired', 'Cancelled'].includes(order.status);
  const listing = order.listing;
  const other = order.donor?._id === order.ngo?._id ? order.donor : order.ngo;
  return (
    <Card className={`order-card ${isActive ? 'order-active' : ''}`}>
      <div className="order-card-photo">
        <FoodImage src={listing?.photos?.[0]} alt={listing?.foodName} />
        {order.unreadCount > 0 && <span className="unread-pip">{order.unreadCount}</span>}
      </div>
      <div className="order-card-body">
        <div className="between">
          <Badge tone={isActive ? 'green' : ''}>{order.status}</Badge>
          {isActive && listing?.pickupBy && <CountdownRing until={listing.pickupBy} />}
        </div>
        <h3>{listing?.foodName || 'Donation'}</h3>
        <p className="muted" style={{ fontSize: 12 }}>{listing?.neighbourhood} · {listing?.servings} servings</p>
        <div className="order-card-footer">
          <Button asChild size="sm">
            <Link to={`/orders/${order._id}`}>
              {order.unreadCount > 0 ? <><MessageSquare size={14} />{order.unreadCount} new message{order.unreadCount > 1 ? 's' : ''}</> : 'View order'}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ─── Chat window ─── */
function ChatWindow({ orderId }) {
  const { user, socket } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const endRef = useRef(null);

  const messages = useQuery(query(['chat', orderId], `/chat/${orderId}`, { staleTime: 5000 }));

  // Merge server messages with local optimistic messages
  const allMessages = messages.data || localMessages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, typing]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg) => {
      setLocalMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    const handleTyping = ({ userId }) => {
      if (userId !== user?._id) { setTyping(true); setTimeout(() => setTyping(false), 2000); }
    };
    socket.on(`order:${orderId}:message`, handleMessage);
    socket.on(`order:${orderId}:typing`, handleTyping);
    return () => {
      socket.off(`order:${orderId}:message`, handleMessage);
      socket.off(`order:${orderId}:typing`, handleTyping);
    };
  }, [socket, orderId, user]);

  useEffect(() => {
    if (messages.data) setLocalMessages(messages.data);
  }, [messages.data]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const draft = text;
    setText('');
    try {
      const msg = await api(`/chat/${orderId}`, { method: 'POST', body: { text: draft } });
      setLocalMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    } catch (err) {
      toast.error(err.message);
      setText(draft);
    } finally {
      setSending(false);
    }
  }

  function handleKeyChange(e) {
    setText(e.target.value);
    socket?.emit('typing', { orderId, userId: user?._id });
  }

  return (
    <div className="chat-panel">
      <div className="chat-notice">
        <ShieldAlert size={13} /> Contact details are hidden. Use this conversation for all coordination.
      </div>
      <div className="chat-messages">
        {messages.isPending && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading messages…</p>}
        {allMessages.map(msg => (
          <ChatBubble key={msg._id} message={msg} mine={String(msg.sender?._id || msg.sender) === String(user?._id)} />
        ))}
        {typing && <div className="typing-indicator"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          onChange={handleKeyChange}
          placeholder="Message your partner…"
          maxLength={2000}
          aria-label="Chat message"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}

/* ─── Proof upload form ─── */
function ProofForm({ orderId, servings, onDone }) {
  const [form, setForm] = useState({ photo: '', peopleFed: '', note: '' });
  const submit = useAction(
    () => api(`/orders/${orderId}/proof`, { method: 'POST', body: { ...form, peopleFed: Number(form.peopleFed) } }),
    () => { celebrate(); onDone(); }
  );
  return (
    <Card className="panel stack">
      <span className="eyebrow"><Camera size={14} /> Distribution proof</span>
      <h3>Confirm the good you did</h3>
      <p className="muted">Upload a photo and tell us how many people received this food. This unlocks your Certificate of Honor.</p>
      <form className="stack" onSubmit={e => { e.preventDefault(); submit.mutate(); }}>
        <UploadField label="Distribution photo" kind="proof" value={form.photo ? [form.photo] : []} onChange={([v]) => setForm(f => ({ ...f, photo: v || '' }))} />
        <Field label={`People fed (max ${servings})`}>
          <input type="number" min={1} max={servings} required value={form.peopleFed} onChange={e => setForm(f => ({ ...f, peopleFed: e.target.value }))} />
        </Field>
        <Field label="A note for the donor">
          <textarea required minLength={5} maxLength={1000} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="How did the distribution go? Any heartwarming moments to share?" />
        </Field>
        <Button disabled={submit.isPending || !form.photo}>
          {submit.isPending ? 'Submitting…' : 'Submit proof'}
        </Button>
      </form>
    </Card>
  );
}

/* ─── Review form ─── */
function ReviewForm({ orderId, onDone }) {
  const existingReviews = useQuery(query(['reviews', orderId], `/orders/${orderId}/reviews`));
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const alreadyReviewed = existingReviews.data?.some(r => String(r.reviewer?._id || r.reviewer) === String(user?._id));

  const submit = useAction(
    () => api(`/orders/${orderId}/reviews`, { method: 'POST', body: { rating, text } }),
    () => { toast.success('Review submitted. Thank you.'); onDone(); }
  );

  if (existingReviews.isPending) return null;
  if (alreadyReviewed) return <p className="muted" style={{ fontSize: 12 }}>✓ Your review has been submitted.</p>;

  return (
    <form className="stack" onSubmit={e => { e.preventDefault(); submit.mutate(); }}>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" className={`star ${n <= rating ? 'active' : ''}`} onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star size={20} fill={n <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <Field label="Leave a short review">
        <textarea required minLength={5} maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder="How did it go?" />
      </Field>
      <Button size="sm" disabled={submit.isPending}>{submit.isPending ? 'Submitting…' : 'Submit review'}</Button>
    </form>
  );
}

/* ─── Order Detail Page ─── */
export function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProof, setShowProof] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const order = useQuery(query(['order', orderId], `/orders/${orderId}`, { refetchInterval: 15000 }));

  const markPickedUp = useAction(
    () => api(`/orders/${orderId}/status`, { method: 'PATCH', body: { status: 'Picked Up' } }),
    () => toast.success('Pickup confirmed! Please upload your distribution proof after delivery.')
  );

  if (order.isPending) return <div className="container section"><div className="skeleton" style={{ height: 400, borderRadius: 20 }} /></div>;
  if (order.error) return <div className="container section"><p className="muted">Order not found.</p></div>;

  const o = order.data;
  const isNgo = user?.role === 'ngo' || String(o.ngo?._id) === String(user?._id);
  const isDonor = String(o.donor?._id) === String(user?._id);
  const listing = o.listing;
  const canPickup = isNgo && o.status === 'Claimed';
  const canProof = isNgo && o.status === 'Picked Up' && !showProof;
  const canReview = o.status === 'Distributed' && !showReview;

  return (
    <div className="container workspace">
      <div className="page-heading between">
        <div>
          <button className="back-link" onClick={() => navigate('/orders')}><ArrowLeft size={16} /> My orders</button>
          <span className="eyebrow" style={{ marginTop: 8 }}>ORDER JOURNEY</span>
          <h1>{listing?.foodName || 'Food Order'}</h1>
          <p>{listing?.neighbourhood} · {listing?.servings} servings</p>
        </div>
        <Badge tone={o.status === 'Distributed' ? 'green' : o.status === 'Claimed' ? 'amber' : ''}>{o.status}</Badge>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="stack">
          {/* Food photo + timeline */}
          <Card className="panel stack">
            <div className="detail-photo"><FoodImage src={listing?.photos?.[0]} alt={listing?.foodName} /></div>
            <StatusTimeline status={o.status} timeline={o.timeline} />
          </Card>

          {/* Pickup window */}
          {['Claimed', 'Picked Up'].includes(o.status) && listing?.pickupBy && (
            <Card className="panel stack collection-pass">
              <span className="eyebrow"><Clock size={14} /> Collection window</span>
              <CountdownRing until={listing.pickupBy} />
              <p><strong>Pickup by:</strong> {dateTime(listing.pickupBy)}</p>
              {listing.exactAddress && <p><strong>Address:</strong> {listing.exactAddress}</p>}
            </Card>
          )}

          {/* Action buttons */}
          {canPickup && (
            <Button disabled={markPickedUp.isPending} onClick={() => markPickedUp.mutate()}>
              <Truck size={16} /> {markPickedUp.isPending ? 'Confirming…' : 'Confirm pickup'}
            </Button>
          )}
          {canProof && <Button onClick={() => setShowProof(true)}><Camera size={16} /> Upload distribution proof</Button>}
          {showProof && <ProofForm orderId={orderId} servings={listing?.servings} onDone={() => { setShowProof(false); order.refetch(); }} />}

          {/* Distribution proof display */}
          {o.distributionProof?.photo && (
            <Card className="panel stack">
              <span className="eyebrow"><CheckCircle size={14} /> Distribution proof</span>
              <FoodImage src={o.distributionProof.photo} alt="Distribution" style={{ height: 200, borderRadius: 16 }} />
              <p><Users size={14} style={{ display: 'inline' }} /> <strong>{o.distributionProof.peopleFed}</strong> people fed</p>
              <p className="muted">{o.distributionProof.note}</p>
              <small className="muted">Submitted {dateTime(o.distributionProof.submittedAt)}</small>
            </Card>
          )}

          {/* Reviews */}
          {canReview && (
            <Card className="panel stack">
              <span className="eyebrow"><Star size={14} /> Leave a review</span>
              <h3>How did it go?</h3>
              <p className="muted">Two-way ratings help build trust in the community.</p>
              {showReview
                ? <ReviewForm orderId={orderId} onDone={() => { setShowReview(false); order.refetch(); }} />
                : <Button size="sm" onClick={() => setShowReview(true)}>Rate this experience</Button>
              }
            </Card>
          )}
        </div>

        {/* Right column — chat + partners */}
        <div className="stack">
          <Card className="panel stack">
            <span className="eyebrow"><MessageSquare size={14} /> Conversation</span>
            <ChatWindow orderId={orderId} />
          </Card>

          <Card className="panel stack">
            <span className="eyebrow">Partners on this order</span>
            <div className="row">
              <Avatar name={o.donor?.name} size={44} />
              <div>
                <strong>{o.donor?.name}</strong>
                <br /><small className="muted">Donor</small>
              </div>
            </div>
            <div className="row">
              <Avatar name={o.ngo?.name} size={44} />
              <div>
                <strong>{o.ngo?.name}</strong>
                <br /><small className="muted">NGO</small>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Orders List Page ─── */
export function Orders() {
  const { user } = useAuth();
  const orders = useQuery(query('orders', '/orders', { refetchInterval: 30000 }));
  const active = orders.data?.filter(o => !['Distributed', 'Expired', 'Cancelled'].includes(o.status)) || [];
  const past = orders.data?.filter(o => ['Distributed', 'Expired', 'Cancelled'].includes(o.status)) || [];

  return (
    <Page
      eyebrow="YOUR SHARED JOURNEYS"
      title={<>Every order.<br /><em>A meal's story.</em></>}
      description="Track active collections, confirm pickups, submit proofs, and chat with your partner."
    >
      <QueryState query={orders} empty="Your first shared meal will appear here.">
        {() => (
          <div className="stack">
            {active.length > 0 && (
              <>
                <h2 style={{ fontSize: 22 }}>Active orders ({active.length})</h2>
                <div className="grid-3">
                  {active.map(o => <OrderCard key={o._id} order={o} />)}
                </div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 style={{ fontSize: 22, marginTop: 32 }}>Completed & closed</h2>
                <div className="grid-3">
                  {past.map(o => <OrderCard key={o._id} order={o} />)}
                </div>
              </>
            )}
          </div>
        )}
      </QueryState>
    </Page>
  );
}
