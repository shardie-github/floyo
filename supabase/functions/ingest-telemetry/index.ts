// Supabase Edge Function: Ingest Telemetry
// Ingests telemetry events from clients
// All configuration pulled from environment variables dynamically

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Get configuration from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const { user_id, app = 'web', type, path, meta } = await req.json().catch(() => ({}));
    
    if (!user_id || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id and type' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const supa = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await supa.from('telemetry_events').insert({ 
      user_id, 
      app, 
      type, 
      path, 
      meta 
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
});
