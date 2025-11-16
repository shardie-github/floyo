/**
 * Suggestions API Route
 * 
 * Handles AI-powered integration and tool suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandler } from '@/lib/api/error-handler';

export const runtime = 'nodejs';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user patterns
  const { data: patterns, error: patternsError } = await supabase
    .from('patterns')
    .select('*')
    .eq('userId', userId)
    .order('count', { ascending: false })
    .limit(10);

  if (patternsError) {
    console.error('Error fetching patterns:', patternsError);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }

  // Generate suggestions based on patterns
  const suggestions = generateSuggestions(patterns || []);

  return NextResponse.json({ suggestions });
});

function generateSuggestions(patterns: any[]): any[] {
  const suggestions: any[] = [];

  // Example suggestion logic based on file extensions
  const extensionMap: Record<string, string[]> = {
    '.tsx': ['TypeScript', 'React', 'ESLint', 'Prettier'],
    '.ts': ['TypeScript', 'ESLint', 'Prettier'],
    '.jsx': ['React', 'ESLint', 'Prettier'],
    '.js': ['ESLint', 'Prettier', 'Jest'],
    '.py': ['Python', 'Black', 'Ruff', 'Pytest'],
    '.go': ['Go', 'gofmt', 'golint'],
  };

  for (const pattern of patterns) {
    const ext = pattern.fileExtension;
    const tools = extensionMap[ext] || [];

    for (const tool of tools) {
      suggestions.push({
        type: 'tool',
        title: `Consider using ${tool}`,
        description: `You're using ${ext} files frequently. ${tool} would help optimize your workflow.`,
        priority: 'medium',
        fileExtension: ext,
      });
    }
  }

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}
