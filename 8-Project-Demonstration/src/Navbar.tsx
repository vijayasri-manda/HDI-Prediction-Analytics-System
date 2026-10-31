import { useEffect, useRef, useState } from 'react';
import { KeyRound, Menu, Moon, Sun, X } from 'lucide-react';

const pages = [
  {id:'overview',label:'Home'}, {id:'explore',label:'Explore Data'},
  {id:'predict',label:'HDI Predictor'}, {id:'scenarios',label:'Scenarios'},
  {id:'evaluation',label:'Methodology'},
];
export default function Navbar({page,dark,onTheme,onNavigate,onSettings,configured}: {
  page:string; dark:boolean; onTheme:()=>void; onNavigate:(page:string)=>void;
  onSettings:()=>void; configured:boolean;
}) {
  const [open,setOpen]=useState(false);
  const header=useRef<HTMLElement>(null);
  const menu=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    header.current?.querySelector<HTMLAnchorElement>('nav a[aria-current="page"], nav a')?.focus();
    const outside=(e:PointerEvent)=>{if(!header.current?.contains(e.target as Node))setOpen(false);};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);menu.current?.focus();}};
    const query=matchMedia('(min-width:1081px)');
    const resize=()=>{if(query.matches)setOpen(false);};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    query.addEventListener('change',resize);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);query.removeEventListener('change',resize);};
  },[open]);
  return <header className="site-header" ref={header}>
    <div className="nav-container">
      <a className="site-brand" href="#overview" onClick={()=>{setOpen(false);onNavigate('overview');}} aria-label="HDI Intelligence home"><img src="/hdi-logo.svg" alt="" width="42" height="42"/><span>HDI <strong>Intelligence</strong></span></a>
      <nav id="site-navigation" className={`site-navigation ${open?'is-open':''}`} aria-label="Main navigation">
        {pages.map(p=><a key={p.id} href={`#${p.id}`} aria-current={page===p.id?'page':undefined} className={page===p.id?'active':''} onClick={()=>{setOpen(false);onNavigate(p.id);}}>{p.label}</a>)}
      </nav>
      <div className="nav-actions">
        <button className={`icon-button api-settings-button ${configured?'is-configured':''}`} aria-label="AI Settings" title={configured?'AI Settings · personal key configured':'AI Settings · add your Groq key'} onClick={()=>{setOpen(false);onSettings();}}><KeyRound size={19}/>{configured&&<span className="connection-dot"/>}</button>
        <button className="icon-button theme-button" aria-label={dark?'Switch to light mode':'Switch to dark mode'} onClick={onTheme}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button>
        <button ref={menu} className="icon-button menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="site-navigation" onClick={()=>setOpen(v=>!v)}>{open?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </div>
  </header>;
}
