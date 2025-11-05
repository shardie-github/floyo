import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  if(req.method!=='POST') return new Response('Method Not Allowed',{status:405});
  const { user_id, app='web', type, path, meta } = await req.json().catch(()=>({}));
  if(!user_id || !type) return new Response('Missing fields',{status:400});
  const supa=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await supa.from('telemetry_events').insert({ user_id, app, type, path, meta });
  if(error) return new Response(error.message,{status:500});
  return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});
});
