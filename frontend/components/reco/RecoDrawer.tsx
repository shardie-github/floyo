"use client";
import { useEffect, useState } from "react";
type Reco = { title:string; body?:string; kind:string; score:number; cta?:{label:string;href?:string;action?:string}; rationale?:any };
export default function RecoDrawer({ userId }:{ userId:string }){
  const [open,setOpen]=useState(false); const [recs,setRecs]=useState<Reco[]>([]);
  useEffect(()=>{
    const consent=localStorage.getItem("telemetry_consent")==="1"; if(!consent) return;
    const appId=(process.env.NEXT_PUBLIC_APP_ID||document.querySelector('meta[name="x-app-id"]')?.getAttribute('content')||'generic').toLowerCase();
    const route = appId==='floyo' ? '/api/reco/floyo' : appId==='whatsfordinner' ? '/api/reco/whatsfordinner' : '';
    if(!route) return;
    fetch(route,{ method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ userId })})
      .then(r=>r.json()).then(d=>setRecs(d.recs||[]));
  },[userId]);
  function act(c?:Reco['cta']){ if(!c) return; if(c.href) location.href=c.href; if(c.action==='enable:stability') localStorage.setItem('stability','1'); }
  return (<>
    <button onClick={()=>setOpen(v=>!v)} className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-accent text-accent-fg shadow-card" aria-expanded={open}>☆</button>
    {open && <aside className="fixed bottom-20 right-4 w-[92vw] sm:w-[420px] max-h-[70vh] overflow-auto rounded-2xl border bg-card p-4 shadow-card">
      <div className="text-sm font-semibold mb-2">Suggested for you</div>
      <div className="space-y-3">
        {recs.map((r,i)=>(
          <div key={i} className="rounded-xl border p-3">
            <div className="text-sm font-semibold">{r.title}</div>
            {r.body && <div className="text-xs text-muted-foreground">{r.body}</div>}
            <div className="text-[11px] text-muted-foreground mt-1">Why: {r.rationale ? JSON.stringify(r.rationale) : 'your recent activity'}</div>
            {r.cta && <button className="mt-2 text-xs underline" onClick={()=>act(r.cta)}>{r.cta.label}</button>}
          </div>
        ))}
        {!recs.length && <div className="text-xs text-muted-foreground">No suggestions yet.</div>}
      </div>
    </aside>}
  </>);
}
