// Supabase Edge Function: Generate Suggestions
// Generates integration suggestions based on user patterns

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
  // Handle CORS
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
      .order('timestamp', { ascending: false })
      .limit(100)

    if (eventsError) throw eventsError

    // Get patterns
    const { data: patterns, error: patternsError } = await supabaseClient
      .from('patterns')
      .select('*')
      .eq('user_id', user.id)

    if (patternsError) throw patternsError

    // Analyze patterns and generate suggestions
    const suggestions = []

    // Analyze file extensions
    const fileExtensions = new Map<string, number>()
    events?.forEach(event => {
      if (event.file_path) {
        const ext = event.file_path.split('.').pop()?.toLowerCase() || ''
        if (ext) {
          fileExtensions.set(ext, (fileExtensions.get(ext) || 0) + 1)
        }
      }
    })

    // Generate suggestions based on file types
    for (const [ext, count] of fileExtensions.entries()) {
      if (count >= 3) {
        let suggestion = null
        switch (ext) {
          case 'py':
            suggestion = {
              user_id: user.id,
              trigger: `Recently used ${ext} files`,
              tools_involved: ['python'],
              suggested_integration: 'Dropbox API - auto-sync output files',
              sample_code: `# Auto-sync Python script output to Dropbox
import dropbox
from pathlib import Path

def sync_to_dropbox(local_file, remote_path):
    dbx = dropbox.Dropbox('YOUR_ACCESS_TOKEN')
    with open(local_file, 'rb') as f:
        dbx.files_upload(f.read(), remote_path)

output_file = 'results.json'
sync_to_dropbox(output_file, '/scripts/output/' + output_file)`,
              reasoning: `You've used Python files ${count} times recently. Consider automating workflow with Dropbox.`,
              actual_files: events?.filter(e => e.file_path?.endsWith('.' + ext)).slice(0, 3).map(e => e.file_path),
              confidence: Math.min(count / 10, 0.9)
            }
            break
          case 'js':
            suggestion = {
              user_id: user.id,
              trigger: `Recently used ${ext} files`,
              tools_involved: ['nodejs', 'javascript'],
              suggested_integration: 'Webhook API - trigger external services',
              sample_code: `// Trigger webhook after script execution
const https = require('https');

function triggerWebhook(url, data) {
  const postData = JSON.stringify(data);
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  const req = https.request(url, options, (res) => {
    console.log('Webhook triggered');
  });
  req.write(postData);
  req.end();
}`,
              reasoning: `You've used JavaScript files ${count} times. Consider adding webhook integrations.`,
              actual_files: events?.filter(e => e.file_path?.endsWith('.' + ext)).slice(0, 3).map(e => e.file_path),
              confidence: Math.min(count / 10, 0.9)
            }
            break
        }

        if (suggestion) {
          suggestions.push(suggestion)
        }
      }
    }

    // Insert suggestions
    if (suggestions.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('suggestions')
        .insert(suggestions)

      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions_created: suggestions.length,
        suggestions 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
