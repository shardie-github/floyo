/**
 * Financial Manager
 * Handles cost observability, profitability analysis, margins, and operating expenses
 */

import Stripe from 'stripe'
import { QuickBooks } from 'quickbooks-node-sdk'

export interface CostEntry {
  id?: string
  service: string
  resource: string
  cost: number
  currency: string
  period: {
    start: Date
    end: Date
  }
  metadata?: Record<string, any>
  createdAt?: Date
}

export interface RevenueEntry {
  id?: string
  source: 'subscriptions' | 'marketplace' | 'api' | 'enterprise' | 'other'
  amount: number
  currency: string
  period: {
    start: Date
    end: Date
  }
  metadata?: Record<string, any>
  createdAt?: Date
}

export interface OperatingExpense {
  id?: string
  category: 'infrastructure' | 'operations' | 'marketing' | 'sales' | 'development' | 'support' | 'other'
  amount: number
  currency: string
  description: string
  period: {
    start: Date
    end: Date
  }
  metadata?: Record<string, any>
  createdAt?: Date
}

export interface ProfitabilityMetrics {
  period: {
    start: Date
    end: Date
  }
  revenue: {
    total: number
    bySource: Record<string, number>
  }
  costs: {
    total: number
    byService: Record<string, number>
  }
  operatingExpenses: {
    total: number
    byCategory: Record<string, number>
  }
  margins: {
    gross: number
    net: number
    grossMargin: number
    netMargin: number
  }
  profitability: {
    grossProfit: number
    netProfit: number
    profitMargin: number
  }
}

export interface FinancialConfig {
  stripeApiKey: string
  quickbooks?: {
    clientId: string
    clientSecret: string
    accessToken: string
    realmId: string
  }
  database: any // Database connection
  alertThresholds?: {
    costIncrease?: number // Percentage
    marginDecrease?: number // Percentage
    expenseThreshold?: number // Absolute value
  }
}

export class FinancialManager {
  private stripe: Stripe
  private quickbooks?: QuickBooks
  private db: any
  private config: FinancialConfig

  constructor(config: FinancialConfig) {
    this.config = config
    this.stripe = new Stripe(config.stripeApiKey, {
      apiVersion: '2023-10-16'
    })

    if (config.quickbooks) {
      this.quickbooks = new QuickBooks({
        consumerKey: config.quickbooks.clientId,
        consumerSecret: config.quickbooks.clientSecret,
        accessToken: config.quickbooks.accessToken,
        realmId: config.quickbooks.realmId
      })
    }

    this.db = config.database
  }

  /**
   * Track cost entry
   */
  async trackCost(cost: CostEntry): Promise<CostEntry> {
    const entry = {
      ...cost,
      id: cost.id || this.generateId(),
      createdAt: cost.createdAt || new Date()
    }

    // Store in database
    await this.db.query(
      `INSERT INTO cost_tracking (id, service, resource, cost, currency, period_start, period_end, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.id,
        entry.service,
        entry.resource,
        entry.cost,
        entry.currency,
        entry.period.start,
        entry.period.end,
        JSON.stringify(entry.metadata || {}),
        entry.createdAt
      ]
    )

    // Check alerts
    await this.checkCostAlerts(entry)

    return entry
  }

  /**
   * Track revenue entry
   */
  async trackRevenue(revenue: RevenueEntry): Promise<RevenueEntry> {
    const entry = {
      ...revenue,
      id: revenue.id || this.generateId(),
      createdAt: revenue.createdAt || new Date()
    }

    // Store in database
    await this.db.query(
      `INSERT INTO revenue_tracking (id, source, amount, currency, period_start, period_end, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.id,
        entry.source,
        entry.amount,
        entry.currency,
        entry.period.start,
        entry.period.end,
        JSON.stringify(entry.metadata || {}),
        entry.createdAt
      ]
    )

    return entry
  }

  /**
   * Track operating expense
   */
  async trackOperatingExpense(expense: OperatingExpense): Promise<OperatingExpense> {
    const entry = {
      ...expense,
      id: expense.id || this.generateId(),
      createdAt: expense.createdAt || new Date()
    }

    // Store in database
    await this.db.query(
      `INSERT INTO operating_expenses (id, category, amount, currency, description, period_start, period_end, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.id,
        entry.category,
        entry.amount,
        entry.currency,
        entry.description,
        entry.period.start,
        entry.period.end,
        JSON.stringify(entry.metadata || {}),
        entry.createdAt
      ]
    )

    return entry
  }

  /**
   * Analyze profitability for a period
   */
  async analyzeProfitability(
    startDate: Date,
    endDate: Date
  ): Promise<ProfitabilityMetrics> {
    // Get revenue
    const revenueResult = await this.db.query(
      `SELECT source, SUM(amount) as total
       FROM revenue_tracking
       WHERE period_start >= $1 AND period_end <= $2
       GROUP BY source`,
      [startDate, endDate]
    )

    const revenueBySource: Record<string, number> = {}
    let totalRevenue = 0

    for (const row of revenueResult.rows) {
      revenueBySource[row.source] = parseFloat(row.total)
      totalRevenue += parseFloat(row.total)
    }

    // Get costs
    const costResult = await this.db.query(
      `SELECT service, SUM(cost) as total
       FROM cost_tracking
       WHERE period_start >= $1 AND period_end <= $2
       GROUP BY service`,
      [startDate, endDate]
    )

    const costsByService: Record<string, number> = {}
    let totalCosts = 0

    for (const row of costResult.rows) {
      costsByService[row.service] = parseFloat(row.total)
      totalCosts += parseFloat(row.total)
    }

    // Get operating expenses
    const expenseResult = await this.db.query(
      `SELECT category, SUM(amount) as total
       FROM operating_expenses
       WHERE period_start >= $1 AND period_end <= $2
       GROUP BY category`,
      [startDate, endDate]
    )

    const expensesByCategory: Record<string, number> = {}
    let totalExpenses = 0

    for (const row of expenseResult.rows) {
      expensesByCategory[row.category] = parseFloat(row.total)
      totalExpenses += parseFloat(row.total)
    }

    // Calculate margins
    const grossProfit = totalRevenue - totalCosts
    const netProfit = grossProfit - totalExpenses
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      period: { start: startDate, end: endDate },
      revenue: {
        total: totalRevenue,
        bySource: revenueBySource
      },
      costs: {
        total: totalCosts,
        byService: costsByService
      },
      operatingExpenses: {
        total: totalExpenses,
        byCategory: expensesByCategory
      },
      margins: {
        gross: grossProfit,
        net: netProfit,
        grossMargin,
        netMargin
      },
      profitability: {
        grossProfit,
        netProfit,
        profitMargin: netMargin
      }
    }
  }

  /**
   * Get cost observability data
   */
  async getCostObservability(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: Date; costs: Record<string, number>; total: number }>> {
    const interval = groupBy === 'day' ? 'day' : groupBy === 'week' ? 'week' : 'month'

    const result = await this.db.query(
      `SELECT 
         DATE_TRUNC($3, period_start) as date,
         service,
         SUM(cost) as total
       FROM cost_tracking
       WHERE period_start >= $1 AND period_end <= $2
       GROUP BY DATE_TRUNC($3, period_start), service
       ORDER BY date, service`,
      [startDate, endDate, interval]
    )

    const data: Record<string, { costs: Record<string, number>; total: number }> = {}

    for (const row of result.rows) {
      const dateKey = row.date.toISOString()
      if (!data[dateKey]) {
        data[dateKey] = { costs: {}, total: 0 }
      }
      data[dateKey].costs[row.service] = parseFloat(row.total)
      data[dateKey].total += parseFloat(row.total)
    }

    return Object.entries(data).map(([date, values]) => ({
      date: new Date(date),
      ...values
    }))
  }

  /**
   * Check cost alerts
   */
  private async checkCostAlerts(cost: CostEntry): Promise<void> {
    if (!this.config.alertThresholds) {
      return
    }

    // Get previous period costs for comparison
    const previousPeriod = await this.db.query(
      `SELECT SUM(cost) as total
       FROM cost_tracking
       WHERE service = $1
         AND period_start < $2
         AND period_end >= $3`,
      [
        cost.service,
        cost.period.start,
        new Date(cost.period.start.getTime() - (cost.period.end.getTime() - cost.period.start.getTime()))
      ]
    )

    if (previousPeriod.rows.length > 0) {
      const previousTotal = parseFloat(previousPeriod.rows[0].total)
      const currentTotal = cost.cost

      if (previousTotal > 0) {
        const increase = ((currentTotal - previousTotal) / previousTotal) * 100

        if (this.config.alertThresholds.costIncrease && increase > this.config.alertThresholds.costIncrease) {
          await this.sendAlert({
            type: 'cost_increase',
            message: `Cost increase detected for ${cost.service}: ${increase.toFixed(2)}%`,
            severity: 'high',
            data: { cost, previousTotal, currentTotal, increase }
          })
        }
      }
    }

    // Check absolute threshold
    if (this.config.alertThresholds.expenseThreshold && cost.cost > this.config.alertThresholds.expenseThreshold) {
      await this.sendAlert({
        type: 'cost_threshold',
        message: `Cost threshold exceeded for ${cost.service}: $${cost.cost}`,
        severity: 'medium',
        data: { cost }
      })
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(alert: {
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    data: any
  }): Promise<void> {
    // Implement alerting logic (email, Slack, etc.)
    console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.data)
    
    // Store alert in database
    await this.db.query(
      `INSERT INTO financial_alerts (type, message, severity, data, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [alert.type, alert.message, alert.severity, JSON.stringify(alert.data), new Date()]
    )
  }

  /**
   * Sync with Stripe for revenue tracking
   */
  async syncStripeRevenue(startDate: Date, endDate: Date): Promise<void> {
    const charges = await this.stripe.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000)
      },
      limit: 100
    })

    for (const charge of charges.data) {
      if (charge.paid && charge.amount > 0) {
        await this.trackRevenue({
          source: 'subscriptions',
          amount: charge.amount / 100, // Convert from cents
          currency: charge.currency,
          period: {
            start: new Date(charge.created * 1000),
            end: new Date(charge.created * 1000)
          },
          metadata: {
            stripeChargeId: charge.id,
            customerId: charge.customer
          }
        })
      }
    }
  }

  /**
   * Sync with QuickBooks
   */
  async syncQuickBooks(startDate: Date, endDate: Date): Promise<void> {
    if (!this.quickbooks) {
      return
    }

    // Sync expenses
    const expenses = await this.quickbooks.findExpenses({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    for (const expense of expenses) {
      await this.trackOperatingExpense({
        category: this.mapQuickBooksCategory(expense.Category),
        amount: expense.Amount,
        currency: expense.CurrencyRef?.value || 'USD',
        description: expense.Description || '',
        period: {
          start: new Date(expense.TxnDate),
          end: new Date(expense.TxnDate)
        },
        metadata: {
          quickbooksId: expense.Id,
          accountRef: expense.AccountRef?.value
        }
      })
    }
  }

  /**
   * Map QuickBooks category to our categories
   */
  private mapQuickBooksCategory(category: string): OperatingExpense['category'] {
    const mapping: Record<string, OperatingExpense['category']> = {
      'Infrastructure': 'infrastructure',
      'Operations': 'operations',
      'Marketing': 'marketing',
      'Sales': 'sales',
      'Development': 'development',
      'Support': 'support'
    }

    return mapping[category] || 'other'
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
