import { NextRequest, NextResponse } from 'next/server'
import { ModerationService, ModerationRequest } from '@/marketplace/moderation/service'

const moderationService = new ModerationService({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  thresholds: {
    toxicity: 0.7,
    spam: 0.8,
    inappropriate: 0.75,
    autoApprove: 0.3,
    autoReject: 0.8
  },
  webhookSecret: process.env.MODERATION_WEBHOOK_SECRET
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contentType, userId, metadata } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const moderationRequest: ModerationRequest = {
      content,
      contentType: contentType || 'text',
      userId: userId || request.headers.get('user-id') || undefined,
      metadata
    }

    const result = await moderationService.moderate(moderationRequest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { error: 'Moderation failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'moderation',
    version: '1.0.0'
  })
}
