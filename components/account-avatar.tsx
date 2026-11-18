'use client';
import {useEffect, useState} from 'react';
import {initials, type AccountUser} from '@/lib/account';
export function AccountAvatar({user, className=''}:{user:AccountUser;className?:string}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[user.avatar_url]);
  return <span className={`account-avatar ${className}`} aria-hidden="true">
    {user.avatar_url&&!failed?<img src={user.avatar_url} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span>{initials(user.name)}</span>}
  </span>;
}
