'use client';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Send, Settings, Video } from 'lucide-react';
import { io } from 'socket.io-client';
import { useEffect, useMemo, useRef, useState } from 'react';

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', { autoConnect: false, withCredentials: true, auth: {} });

export default function Messenger() {
  const qc = useQueryClient();
  const { activeChatId, set } = useAppStore();
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [call, setCall] = useState<any>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/users/me')).data });
  const { data: chats = [] } = useQuery({ queryKey: ['chats'], queryFn: async () => (await api.get('/chats')).data, enabled: !!me });
  const { data: messages = [] } = useQuery({ queryKey: ['messages', activeChatId], queryFn: async () => (await api.get(`/chats/${activeChatId}/messages`)).data, enabled: !!activeChatId });
  const { data: users = [] } = useQuery({ queryKey: ['users', search], queryFn: async () => (await api.get(`/users/search?q=${encodeURIComponent(search)}`)).data, enabled: search.length > 1 });

  useEffect(() => {
    if (!me) return;
    socket.auth = { token: document.cookie.split('; ').find((c)=>c.startsWith('accessToken='))?.split('=')[1] };
    socket.connect(); socket.emit('auth:join-user-room');
    socket.on('message:new', () => qc.invalidateQueries({ queryKey: ['messages', activeChatId] }));
    socket.on('call:invite', async (payload) => setCall({ ...payload, incoming: true }));
    socket.on('webrtc:offer', async ({ sdp, fromUserId }) => {
      await ensurePc(fromUserId, true);
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pcRef.current!.createAnswer(); await pcRef.current!.setLocalDescription(answer);
      socket.emit('webrtc:answer', { toUserId: fromUserId, sdp: answer });
    });
    socket.on('webrtc:answer', async ({ sdp }) => pcRef.current && await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp)));
    socket.on('webrtc:ice-candidate', async ({ candidate }) => pcRef.current && await pcRef.current.addIceCandidate(candidate));
    return () => { socket.off(); };
  }, [me, activeChatId, qc]);

  const activeChat = useMemo(() => chats.find((c: any) => c.id === activeChatId), [chats, activeChatId]);
  const sendMutation = useMutation({ mutationFn: async () => api.post('/messages', { chatId: activeChatId, text: message }), onSuccess: () => { setMessage(''); qc.invalidateQueries({ queryKey: ['messages', activeChatId] }); } });

  async function ensurePc(peerUserId: string, video: boolean) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    if (localVideo.current) localVideo.current.srcObject = stream;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.ontrack = (e) => { if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0]; };
    pc.onicecandidate = (e) => e.candidate && socket.emit('webrtc:ice-candidate', { toUserId: peerUserId, candidate: e.candidate });
    pcRef.current = pc;
  }

  async function startCall(video: boolean) {
    const other = activeChat?.participants?.find((p: any) => p.userId !== me.id)?.userId;
    if (!other) return;
    await ensurePc(other, video);
    const offer = await pcRef.current!.createOffer(); await pcRef.current!.setLocalDescription(offer);
    socket.emit('call:invite', { toUserId: other, type: video ? 'VIDEO' : 'AUDIO' });
    socket.emit('webrtc:offer', { toUserId: other, sdp: offer });
    setCall({ outgoing: true, video });
  }

  return <div className='h-screen p-4 bg-appbg'><div className='h-[calc(100vh-32px)] bg-white rounded-[20px] shadow-xl grid grid-cols-[320px_minmax(560px,1fr)] overflow-hidden'>
    <aside className='border-r bg-slate-50 flex flex-col'>
      <header className='h-[72px] p-4 flex justify-between'><b>Messenger</b><button onClick={()=>set({settingsOpen:true})}><Settings/></button></header>
      <div className='p-4'><input placeholder='Поиск чатов или @username' className='h-11 w-full rounded-xl border px-3' onChange={(e)=>setSearch(e.target.value)} /></div>
      {search.startsWith('@') && <div className='mx-4 rounded-xl border bg-white max-h-80 overflow-auto'>{users.length?users.map((u:any)=><button key={u.id} className='h-14 w-full text-left px-3 hover:bg-slate-50' onClick={async()=>{const c=(await api.post('/chats/direct',{userId:u.id})).data;set({activeChatId:c.id});}}>{u.displayName} @{u.username}</button>):<div className='h-14 grid place-items-center'>Пользователь не найден</div>}</div>}
      <div className='flex-1 overflow-auto'>{chats.map((c:any)=><button key={c.id} onClick={()=>set({activeChatId:c.id})} className={`h-[76px] mx-2 my-1 p-2 w-[calc(100%-16px)] rounded-xl text-left ${activeChatId===c.id?'bg-blue-100':'hover:bg-slate-100'}`}>{c.title||c.participants?.map((p:any)=>p.user.displayName).join(', ')}</button>)}</div>
    </aside>
    <main className='flex flex-col'>
      <header className='h-[72px] border-b px-4 flex items-center justify-between'>{activeChat?<b>{activeChat.title||'Чат'}</b>:<b>Выберите чат</b>}<div className='flex gap-2'>{activeChat&&<><button className='h-9 w-9 rounded bg-slate-100' onClick={()=>startCall(false)}><Phone size={18}/></button><button className='h-9 w-9 rounded bg-slate-100' onClick={()=>startCall(true)}><Video size={18}/></button></>}</div></header>
      <div className='flex-1 overflow-auto p-4 space-y-2'>{messages.map((m:any)=><div key={m.id} className={`max-w-[68%] rounded-[18px] p-3 relative ${m.senderId===me?.id?'ml-auto bg-blue-100':'bg-slate-100'}`}>{m.text}</div>)}</div>
      {activeChatId && <div className='border-t p-3 flex gap-2'><textarea className='flex-1 min-h-10 max-h-36 rounded-xl border p-2' value={message} onChange={(e)=>setMessage(e.target.value)} placeholder='Напишите сообщение…'/><button onClick={()=>sendMutation.mutate()} className='h-10 w-10 rounded-xl bg-brand text-white'><Send size={18}/></button></div>}
    </main>
  </div>
  {call && <div className='fixed inset-0 bg-slate-900/95 text-white p-8'><div className='h-full flex flex-col items-center justify-center gap-4'><video autoPlay playsInline ref={remoteVideo} className='max-h-[60vh] rounded-xl'/><video autoPlay muted playsInline ref={localVideo} className='w-44 rounded-xl'/><button className='px-4 py-2 bg-red-600 rounded' onClick={()=>{pcRef.current?.close();setCall(null);}}>Завершить</button></div></div>}
  </div>;
}
