/**
 * PropEdge Consistency Engine v2
 * 
 * Core engine for validating trader accounts against FundingPips consistency rules.
 * Manages daily PnL caps, loss limits, and payout eligibility.
 * 
 * @module consistency-engine
 * @version 2.0.0
 */

/**
 * Account configuration profiles defining consistency caps and daily limits
 * @type {Object}
 */
const ACCOUNT_CONFIGS = {
  '2-step-standard': {
    consistencyCap: null,
    dailyLimitPct: 0.05,
    maxLossPct: 0.10
  },
  '2-step-pro': {
    consistencyCap: null,
    dailyLimitPct: 0.03,
    maxLossPct: 0.06
  },
  '1-step': {
    consistencyCap: null,
    dailyLimitPct: 0.05,
    maxLossPct: 0.10
  },
  'zero': {
    consistencyCap: 0.15,
    dailyLimitPct: 0.03,
    maxLossPct: 0.06
  },
  'on-demand': {
    consistencyCap: 0.35,
    dailyLimitPct: null,
    maxLossPct: 0.10
  },
  'pro': {
    consistencyCap: 0.45,
    dailyLimitPct: null,
    maxLossPct: 0.10
  }
};

/**
 * Payout configuration profiles defining consistency caps per payout schedule
 * @type {Object}
 */
const PAYOUT_CONFIGS = {
  'standard': {
    consistencyCap: null
  },
  'on-demand': {
    consistencyCap: 0.35
  },
  'weekly': {
    consistencyCap: null
  },
  'monthly': {
    consistencyCap: null
  }
};

/**
 * Calculate consistency metrics for a set of trades
 * 
 * @param {Array<Object>} trades - Array of trade objects with openTime, closeTime, profit
 * @param {string} accountType - Account type key from ACCOUNT_CONFIGS
 * @param {string} payoutType - Payout type key from PAYOUT_CONFIGS
 * @returns {Object} Consistency analysis result
 */
function calculate(trades, accountType, payoutType) {
  const dailyPnL = new Map();
  
  // Group trades by date
  trades.forEach(trade => {
    const closeTime = new Date(trade.closeTime);
    const dateKey = closeTime.toISOString().split('T')[0];
    
    if (!dailyPnL.has(dateKey)) {
      dailyPnL.set(dateKey, 0);
    }
    dailyPnL.set(dateKey, dailyPnL.get(dateKey) + (trade.profit || 0));
  });
  
  // Calculate metrics
  const totalProfit = Array.from(dailyPnL.values()).reduce((sum, pnl) => sum + pnl, 0);
  const profitDays = Array.from(dailyPnL.entries())
    .filter(([, pnl]) => pnl > 0)
    .map(([date, pnl]) => ({ date, pnl }));
  
  const bestDayProfit = profitDays.length > 0 
    ? Math.max(...profitDays.map(d => d.pnl))
    : 0;
  
  const bestDayDate = profitDays.length > 0
    ? profitDays.find(d => d.pnl === bestDayProfit)?.date || null
    : null;
  
  // Determine effective cap
  const accountCap = ACCOUNT_CONFIGS[accountType]?.consistencyCap;
  const payoutCap = PAYOUT_CONFIGS[payoutType]?.consistencyCap;
  const cap = accountCap !== undefined ? accountCap : payoutCap;
  
  // Special case: Consistency Zero always 15%
  const effectiveCap = accountType === 'zero' ? 0.15 : cap;
  
  // Today's PnL (most recent day)
  const today = new Date().toISOString().split('T')[0];
  const todayPnL = dailyPnL.get(today) || 0;
  
  // Calculate max allowed for today
  let maxToday = Infinity;
  if (effectiveCap && totalProfit > 0) {
    maxToday = (effectiveCap * totalProfit) / (1 - effectiveCap) - Math.max(todayPnL, 0);
  }
  
  // Current consistency ratio
  const currentRatio = totalProfit > 0 ? bestDayProfit / totalProfit : 0;
  
  // Check if violating cap
  const isViolating = effectiveCap ? currentRatio > effectiveCap : false;
  
  // Count metrics
  const daysTraded = dailyPnL.size;
  const winDays = profitDays.length;
  
  return {
    totalProfit: Math.round(totalProfit * 100) / 100,
    bestDayProfit: Math.round(bestDayProfit * 100) / 100,
    bestDayDate,
    cap: effectiveCap,
    isViolating,
    currentRatio: Math.round(currentRatio * 10000) / 10000,
    maxToday: Math.round(maxToday * 100) / 100,
    dailyPnL: Object.fromEntries(dailyPnL),
    todayPnL: Math.round(todayPnL * 100) / 100,
    daysTraded,
    winDays,
    hasCap: !!effectiveCap,
    accountType,
    payoutType,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Validate daily loss limit for current trading day
 * 
 * @param {number} todayPnL - Today's profit/loss
 * @param {number} accountBalance - Current account balance
 * @param {string} accountType - Account type key
 * @returns {Object} Validation result
 */
function validateDailyLimit(todayPnL, accountBalance, accountType) {
  const config = ACCOUNT_CONFIGS[accountType];
  
  if (!config || !config.dailyLimitPct) {
    return {
      isValid: true,
      message: 'No daily limit configured for this account type'
    };
  }
  
  const limit = accountBalance * config.dailyLimitPct;
  const isValid = Math.abs(todayPnL) <= limit;
  
  return {
    isValid,
    limit: Math.round(limit * 100) / 100,
    todayPnL: Math.round(todayPnL * 100) / 100,
    percentage: Math.round((Math.abs(todayPnL) / accountBalance) * 10000) / 100,
    message: isValid ? 'Within daily limit' : 'Daily limit exceeded'
  };
}

/**
 * Check payout eligibility based on consistency rules
 * 
 * @param {Array<Object>} trades - Array of trade objects
 * @param {string} accountType - Account type key
 * @param {string} payoutType - Payout type key
 * @param {number} minTradingDays - Minimum trading days required (default 5)
 * @returns {Object} Eligibility result
 */
function getPayoutEligibility(trades, accountType, payoutType, minTradingDays = 5) {
  const analysis = calculate(trades, accountType, payoutType);
  
  const eligibility = {
    canPayout: true,
    reasons: [],
    analysis
  };
  
  // Check minimum trading days
  if (analysis.daysTraded < minTradingDays) {
    eligibility.canPayout = false;
    eligibility.reasons.push(`Minimum ${minTradingDays} trading days required, current: ${analysis.daysTraded}`);
  }
  
  // Check consistency rule
  if (analysis.isViolating) {
    eligibility.canPayout = false;
    eligibility.reasons.push(
      `Consistency rule violated. Cap: ${(analysis.cap * 100).toFixed(2)}%, Current: ${(analysis.currentRatio * 100).toFixed(2)}%`
    );
  }
  
  // Check minimum profit (if applicable)
  if (analysis.totalProfit <= 0) {
    eligibility.canPayout = false;
    eligibility.reasons.push('Account must be profitable for payout eligibility');
  }
  
  return eligibility;
}

module.exports = {
  ACCOUNT_CONFIGS,
  PAYOUT_CONFIGS,
  calculate,
  validateDailyLimit,
  getPayoutEligibility
};
