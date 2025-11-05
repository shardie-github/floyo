"use client";
export default function ConsentPanel(){
  const set = (k:string,v:'0'|'1')=>localStorage.setItem(k,v);
  const g = (k:string)=>localStorage.getItem(k)==='1';
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="font-semibold text-sm">Privacy & Preferences</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={g('telemetry_consent')} onChange={(e)=>set('telemetry_consent', e.target.checked?'1':'0')} /> Allow in-app telemetry to personalize suggestions</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={g('cloud_sync')} onChange={(e)=>set('cloud_sync', e.target.checked?'1':'0')} /> Enable cloud backup/sync across devices</label>
    </div>
  );
}
