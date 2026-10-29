import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flag, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { api, queryClient } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Dialog } from './dialog';
import { Button, Field, ErrorState, Skeletons, EmptyState } from './ui';
export function Page({eyebrow='THE NEIGHBOURHOOD TABLE',title,description,action,children}) {return <div className="container workspace"><div className="page-heading between"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>{children}</div>;}
export function QueryState({query,children,empty='Nothing here yet'}) {if(query.isPending)return <Skeletons/>;if(query.error)return <ErrorState error={query.error} retry={query.refetch}/>;if(Array.isArray(query.data)&&!query.data.length)return <EmptyState title={empty}/>;return typeof children==='function'?children(query.data):children;}
export function useAction(action,onSuccess) {return useMutation({mutationFn:action,onSuccess:async data=>{await queryClient.invalidateQueries({predicate:q=>q.queryKey[0]!=='session'});onSuccess?.(data);},onError:error=>toast.error(error.message)});}
export function ReportButton({type,id}) {const {user}=useAuth();const [open,setOpen]=useState(false),[reason,setReason]=useState('');const submit=useAction(()=>api('/reports',{method:'POST',body:{targetType:type,targetId:id,reason}}),()=>{setOpen(false);setReason('');toast.success('Report received. Our team will review it.');});if(!user)return null;return <><Button size="sm" variant="ghost" onClick={()=>setOpen(true)} aria-label={`Report ${type}`}><Flag size={14}/>Report</Button><Dialog open={open} onClose={()=>setOpen(false)} title="Help keep this table safe"><form className="stack" onSubmit={e=>{e.preventDefault();submit.mutate();}}><p>Tell our moderation team what happened. Your report is private.</p><Field label="Reason"><textarea required minLength={10} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></Field><Button disabled={submit.isPending}>Submit report</Button></form></Dialog></>;}
export const Go = ({to,children})=><Button asChild variant="secondary"><Link to={to}>{children}<ArrowUpRight size={16}/></Link></Button>;
export function celebrate(){if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)import('canvas-confetti').then(({default:confetti})=>confetti({particleCount:65,spread:60,colors:['#244d3e','#e8ad49','#bc694e'],origin:{y:.7}}));}
