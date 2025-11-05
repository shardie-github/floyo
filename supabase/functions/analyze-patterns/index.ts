// Supabase Edge Function: Analyze Patterns
// Analyzes user events to detect patterns and relationships

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// [CRUX+HARDEN:BEGIN:guardrails]
import { createGuardrails } from '../_shared/guardrails.ts'
// [CRUX+HARDEN:END:guardrails]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// [CRUX+HARDEN:BEGIN:guardrails]
const guardrails = createGuardrails({
  maxExecutionTime: 30000, // 30s
  maxPayloadSize: 1024 * 1024, // 1MB
  requireAuth: true,
});
// [CRUX+HARDEN:END:guardrails]

serve(guardrails.withTimeout(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // [CRUX+HARDEN:BEGIN:guardrails]
    guardrails.validatePayloadSize(await req.text());
    // [CRUX+HARDEN:END:guardrails]

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // [CRUX+HARDEN:BEGIN:guardrails]
    const { user } = await guardrails.validateAuth(supabaseClient, req.headers);
    // [CRUX+HARDEN:END:guardrails]

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get recent events
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true })
      .limit(500)

    if (eventsError) throw eventsError

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No events to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Analyze patterns
    const patterns = new Map<string, {
      count: number
      last_used: string
      tools: Set<string>
    }>()

    // Analyze relationships
    const relationships: Array<{
      source_file: string
      target_file: string
      relation_type: string
      weight: number
    }> = []

    events.forEach(event => {
      if (event.file_path) {
        const ext = event.file_path.split('.').pop()?.toLowerCase() || ''
        if (ext) {
          if (!patterns.has(ext)) {
            patterns.set(ext, {
              count: 0,
              last_used: event.timestamp,
              tools: new Set()
            })
          }
          const pattern = patterns.get(ext)!
          pattern.count++
          if (event.timestamp > pattern.last_used) {
            pattern.last_used = event.timestamp
          }
          if (event.tool) {
            pattern.tools.add(event.tool)
          }
        }
      }
    })

    // Detect temporal patterns and relationships
    for (let i = 0; i < events.length - 1; i++) {
      const prevEvent = events[i]
      const currEvent = events[i + 1]

      if (prevEvent.file_path && currEvent.file_path) {
        const timeDiff = new Date(currEvent.timestamp).getTime() - new Date(prevEvent.timestamp).getTime()
        const secondsDiff = timeDiff / 1000

        // If accessed within 30 seconds, they might be related
        if (secondsDiff < 30 && prevEvent.file_path !== currEvent.file_path) {
          relationships.push({
            source_file: prevEvent.file_path,
            target_file: currEvent.file_path,
            relation_type: 'accessed_together',
            weight: 1
          })
        }
      }
    }

    // Upsert patterns
    for (const [ext, patternData] of patterns.entries()) {
      const { error: patternError } = await supabaseClient
        .from('patterns')
        .upsert({
          user_id: user.id,
          file_extension: ext,
          count: patternData.count,
          last_used: patternData.last_used,
          tools: Array.from(patternData.tools),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,file_extension'
        })

      if (patternError) throw patternError
    }

    // Upsert relationships
    for (const rel of relationships) {
      const { error: relError } = await supabaseClient
        .from('relationships')
        .upsert({
          user_id: user.id,
          source_file: rel.source_file,
          target_file: rel.target_file,
          relation_type: rel.relation_type,
          weight: rel.weight,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,source_file,target_file'
        })

      if (relError) throw relError
    }

    return new Response(
      JSON.stringify({
        success: true,
        patterns_analyzed: patterns.size,
        relationships_found: relationships.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
