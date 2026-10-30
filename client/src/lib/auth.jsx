import { createContext,useContext,useState,useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate,useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { api,queryClient,query } from './api';
import { socketOrigin } from './urls';
import { Skeletons,EmptyState } from '../components/ui';
const AuthContext=createContext(null);
export function AuthProvider({children}) {
  const [token,setToken]=useState(()=>localStorage.getItem('sharebite-token'));
  const [socket,setSocket]=useState(null);
  const session=useQuery(query(['session',token],'/auth/me',{enabled:Boolean(token),retry:false,staleTime:60000}));
  useEffect(()=>{if(session.error?.status===401){localStorage.removeItem('sharebite-token');setToken(null);}},[session.error]);
  useEffect(()=>{
    const connection=io(socketOrigin||undefined,{auth:{token},reconnectionAttempts:5});setSocket(connection);
    const refresh=()=>queryClient.invalidateQueries({predicate:q=>!['session'].includes(q.queryKey[0])});
    connection.on('listings:changed',refresh);connection.on('orders:changed',refresh);connection.on('impact:changed',refresh);connection.on('messages:read',()=>queryClient.invalidateQueries({queryKey:['orders']}));
    connection.on('notification',item=>{refresh();toast(item.title,{description:item.body});if(item.kind==='verification')queryClient.invalidateQueries({queryKey:['session']});});
    return()=>{connection.disconnect();};
  },[token]);
  async function login(path,body) {const result=await api(`/auth/${path}`,{method:'POST',body});localStorage.setItem('sharebite-token',result.token);queryClient.clear();queryClient.setQueryData(['session',result.token],result.user);setToken(result.token);return result.user;}
  function logout(){localStorage.removeItem('sharebite-token');setToken(null);queryClient.clear();toast('See you around the table.');}
  return <AuthContext.Provider value={{user:token?session.data:null,loading:Boolean(token)&&session.isPending,login,logout,socket}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
export function Protected({roles,children}) {const {user,loading}=useAuth(),location=useLocation();if(loading)return <div className="container section"><Skeletons/></div>;if(!user)return <Navigate to="/login" state={{from:location.pathname}} replace/>;if(roles&&!roles.includes(user.role))return <div className="container section"><EmptyState title="A different seat at the table" description="This workspace belongs to another role. Use Demo Mode to switch accounts."/></div>;return children;}
