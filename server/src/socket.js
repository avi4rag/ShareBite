import { Server } from 'socket.io';
import { config } from './config.js';
import { userFromToken } from './auth.js';
import { participantOrder } from './routes/orders.js';
import { sendMessage } from './routes/chat.js';
import { setSocketServer } from './events.js';
export function attachSockets(httpServer) {
  const io = new Server(httpServer,{ cors:{ origin:config.origins, credentials:true, methods:['GET','POST'], allowedHeaders:['Authorization','Content-Type'] },maxHttpBufferSize:16384 });
  setSocketServer(io);
  io.use(async (socket,next) => { try { if (socket.handshake.auth.token) socket.data.user = await userFromToken(socket.handshake.auth.token); next(); } catch { next(new Error('Please sign in again.')); } });
  io.on('connection',socket => {
    if (socket.data.user) socket.join(`user:${socket.data.user._id}`);
    const authenticate = async orderId => { const user = await userFromToken(socket.handshake.auth.token); await participantOrder(orderId,user); return user; };
    socket.on('order:join',async (orderId,ack = () => {}) => { try { await authenticate(orderId); socket.join(`order:${orderId}`); ack({ ok:true }); } catch { ack({ error:'This conversation is private.' }); } });
    socket.on('order:leave',orderId => socket.leave(`order:${orderId}`));
    let lastTyping = 0;
    socket.on('typing',async ({ orderId,typing }) => { try { if (Date.now()-lastTyping < 400) return; lastTyping = Date.now(); const user = await authenticate(orderId); socket.to(`order:${orderId}`).emit('typing',{ orderId,name:user.name,typing:Boolean(typing) }); } catch { /* Unauthorized typing is ignored without exposing room membership. */ } });
    const sent = [];
    socket.on('message:send',async ({ orderId,text },ack = () => {}) => {
      try { const now = Date.now(); while (sent.length && sent[0] < now-60000) sent.shift(); if (sent.length >= 40) return ack({ error:'Please slow down a little.' }); sent.push(now); const user = await authenticate(orderId); ack({ message:await sendMessage(orderId,user,text) }); }
      catch (error) { ack({ error:error.status ? error.message : 'We could not send that message.' }); }
    });
  });
  return io;
}
