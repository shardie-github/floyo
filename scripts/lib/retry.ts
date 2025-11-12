export async function retry<T>(fn:()=>Promise<T>, o:{tries?:number,minMs?:number,maxMs?:number}={}):Promise<T>{
  const tries=o.tries??5, minMs=o.minMs??400, maxMs=o.maxMs??6000; let last:any;
  for(let i=0;i<tries;i++){ try{ return await fn(); }catch(e){ last=e; const d=Math.min(maxMs, Math.round(minMs*Math.pow(2,i)+Math.random()*250)); await new Promise(r=>setTimeout(r,d)); } }
  throw last;
}
