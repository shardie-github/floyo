#!/usr/bin/env tsx
/**
 * Financial model calculator
 * 
 * Usage:
 *   tsx yc/scripts/calculate_financials.ts --current-cash 50000 --monthly-burn 5000
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface FinancialInputs {
  currentCash: number;
  monthlyBurn: number;
  currentMRR: number;
  monthlyGrowthRate: number; // as decimal (0.25 = 25%)
  conversionRate: number; // as decimal (0.1 = 10%)
  arpu: number;
  cac: number;
}

function calculateFinancials(inputs: FinancialInputs) {
  const runway = inputs.currentCash / inputs.monthlyBurn;
  const monthsToBreakEven = inputs.monthlyBurn / (inputs.currentMRR * inputs.monthlyGrowthRate);
  
  const projections = [];
  let mrr = inputs.currentMRR;
  let cash = inputs.currentCash;
  
  for (let month = 1; month <= 12; month++) {
    const newMRR = mrr * inputs.monthlyGrowthRate;
    const revenue = mrr;
    const costs = inputs.monthlyBurn;
    const net = revenue - costs;
    
    cash += net;
    
    projections.push({
      month,
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      net: Math.round(net),
      cash: Math.round(cash),
      paidUsers: Math.round(mrr / inputs.arpu),
    });
    
    mrr += newMRR;
  }
  
  return {
    runway: Math.round(runway),
    monthsToBreakEven: Math.round(monthsToBreakEven),
    projections,
    unitEconomics: {
      cac: inputs.cac,
      ltv: inputs.arpu * 12,
      ltvCacRatio: (inputs.arpu * 12) / inputs.cac,
      paybackPeriod: inputs.cac / inputs.arpu,
    },
  };
}

function generateFinancialModel(inputs: FinancialInputs) {
  const financials = calculateFinancials(inputs);
  
  const model = `
# Financial Model - Auto-Generated
Generated: ${new Date().toISOString()}

## Current State
- Current Cash: $${inputs.currentCash.toLocaleString()}
- Monthly Burn: $${inputs.monthlyBurn.toLocaleString()}
- Current MRR: $${inputs.currentMRR.toLocaleString()}
- Runway: ${financials.runway} months
- Months to Break-Even: ${financials.monthsToBreakEven} months

## Unit Economics
- CAC: $${inputs.cac.toFixed(2)}
- LTV: $${financials.unitEconomics.ltv.toFixed(2)}
- LTV:CAC Ratio: ${financials.unitEconomics.ltvCacRatio.toFixed(1)}:1
- Payback Period: ${financials.unitEconomics.paybackPeriod.toFixed(1)} months

## 12-Month Projections

| Month | MRR | ARR | Revenue | Costs | Net | Cash | Paid Users |
|-------|-----|-----|---------|-------|-----|------|------------|
${financials.projections.map(p => 
  `| ${p.month} | $${p.mrr.toLocaleString()} | $${p.arr.toLocaleString()} | $${p.revenue.toLocaleString()} | $${p.costs.toLocaleString()} | $${p.net.toLocaleString()} | $${p.cash.toLocaleString()} | ${p.paidUsers} |`
).join('\n')}

## Assumptions
- Monthly Growth Rate: ${(inputs.monthlyGrowthRate * 100).toFixed(0)}%
- Conversion Rate: ${(inputs.conversionRate * 100).toFixed(0)}%
- ARPU: $${inputs.arpu.toFixed(2)}
- CAC: $${inputs.cac.toFixed(2)}
`;

  const filePath = join(process.cwd(), 'yc', 'FINANCIAL_MODEL.md');
  writeFileSync(filePath, model);
  console.log('✅ Generated financial model');
}

// Parse arguments
const args = process.argv.slice(2);
const parsedArgs: Record<string, number> = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i]?.startsWith('--')) {
    const key = args[i].substring(2).replace(/-/g, '_');
    const value = parseFloat(args[i + 1]);
    if (!isNaN(value)) {
      parsedArgs[key] = value;
    }
  }
}

const inputs: FinancialInputs = {
  currentCash: parsedArgs.current_cash || 50000,
  monthlyBurn: parsedArgs.monthly_burn || 5000,
  currentMRR: parsedArgs.current_mrr || 0,
  monthlyGrowthRate: parsedArgs.monthly_growth_rate || 0.25,
  conversionRate: parsedArgs.conversion_rate || 0.1,
  arpu: parsedArgs.arpu || 29,
  cac: parsedArgs.cac || 45,
};

generateFinancialModel(inputs);
