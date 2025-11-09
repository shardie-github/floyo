/**
 * AI Chat Assistant API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatAssistant } from '@/lib/ai/chat-assistant';
import { getUserId } from '@/lib/auth-utils';
import { withErrorHandler } from '@/lib/api/error-handler';
import { AuthorizationError, ValidationError } from '@/src/lib/errors';
import { rateLimit } from '@/lib/middleware/rate-limit';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResult = rateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: Object.fromEntries(rateLimitResult.headers.entries()) }
    );
  }

  const userId = await getUserId(request);
  if (!userId) {
    throw new AuthorizationError('Authentication required');
  }

  const body = await request.json();
  const message = body.message;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Message is required', {
      fields: { message: ['Message cannot be empty'] },
    });
  }

  // Set context
  chatAssistant.setContext({ userId, currentPage: body.currentPage });

  // Process message
  const response = await chatAssistant.processMessage(message);

  return NextResponse.json({ response }, {
    headers: Object.fromEntries(rateLimitResult.headers.entries()),
  });
});
