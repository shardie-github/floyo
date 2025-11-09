import { NextRequest, NextResponse } from 'next/server'
import { FinancialManager } from '@/marketplace/financial/manager'

// Initialize financial manager (would use actual database connection in production)
const financialManager = new FinancialManager({
  stripeApiKey: process.env.STRIPE_API_KEY!,
  quickbooks: process.env.QUICKBOOKS_CLIENT_ID ? {
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    accessToken: process.env.QUICKBOOKS_ACCESS_TOKEN!,
    realmId: process.env.QUICKBOOKS_REALM_ID!
  } : undefined,
  database: null, // Would be actual DB connection
  alertThresholds: {
    costIncrease: 20,
    marginDecrease: 10,
    expenseThreshold: 1000
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'track_cost':
        const costEntry = await financialManager.trackCost(data)
        return NextResponse.json({ success: true, data: costEntry })

      case 'track_revenue':
        const revenueEntry = await financialManager.trackRevenue(data)
        return NextResponse.json({ success: true, data: revenueEntry })

      case 'track_expense':
        const expenseEntry = await financialManager.trackOperatingExpense(data)
        return NextResponse.json({ success: true, data: expenseEntry })

      case 'analyze_profitability':
        const { startDate, endDate } = data
        const analysis = await financialManager.analyzeProfitability(
          new Date(startDate),
          new Date(endDate)
        )
        return NextResponse.json({ success: true, data: analysis })

      case 'get_cost_observability':
        const { startDate: obsStart, endDate: obsEnd, groupBy } = data
        const observability = await financialManager.getCostObservability(
          new Date(obsStart),
          new Date(obsEnd),
          groupBy
        )
        return NextResponse.json({ success: true, data: observability })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Financial operation error:', error)
    return NextResponse.json(
      { error: 'Financial operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'profitability') {
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    try {
      const analysis = await financialManager.analyzeProfitability(
        new Date(startDate),
        new Date(endDate)
      )
      return NextResponse.json({ success: true, data: analysis })
    } catch (error) {
      return NextResponse.json(
        { error: 'Analysis failed' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    status: 'ok',
    service: 'financial',
    version: '1.0.0'
  })
}
