/**
 * PropEdge Consistency Engine
 *
 * Implements the exact FundingPips Consistency Rule formula:
 *   maxToday = (cap × totalProfit) / (1 - cap) - Math.max(todayPnL, 0)
 *
 * Account Type Caps:
 *   - Zero:      15% (most restrictive)
 *   - On-Demand: 35%
 *   - Pro:       45%
 *   - 2-Step Standard/Pro, 1-Step: No consistency cap (but daily loss limits apply)
 *
 * Daily Loss Limits:
 *   - 2-Step Standard: 5%
 *   - 2-Step Pro:      3%
 *   - 1-Step:          5%
 *   - Zero:            3%
 *   - On-Demand:       None
 *   - Pro:             None
 */

"use strict";

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────

const ACCOUNT_CONFIGS = {
  "2-step-standard": { consistencyCap: null, dailyLimitPct: 0.05, maxLossPct: 0.10 },
  "2-step-pro":      { consistencyCap: null, dailyLimitPct: 0.03, maxLossPct: 0.06 },
  "1-step":          { consistencyCap: null, dailyLimitPct: 0.05, maxLossPct: 0.10 },
  "zero":            { consistencyCap: 0.15, dailyLimitPct: 0.03, maxLossPct: 0.06 },
  "on-demand":       { consistencyCap: 0.35, dailyLimitPct: null, maxLossPct: 0.10 },
  "pro":             { consistencyCap: 0.45, dailyLimitPct: null, maxLossPct: 0.10 },
};

const PAYOUT_CONFIGS = {
  standard:  { consistencyCap: null },   // uses account default
  "on-demand": { consistencyCap: 0.35 },
  weekly:    { consistencyCap: null },   // no consistency rule for weekly
  monthly:   { consistencyCap: null },   // no consistency rule for monthly
};

// ─────────────────────────────────────────────
// MAIN CALCULATION FUNCTION
// ─────────────────────────────────────────────

/**
 * calculate(trades, accountType, payoutType)
 *
 * @param {Array} trades - Array of trade objects: { closeTime, profit, pnl }
 * @param {string} accountType - e.g. "zero", "on-demand", "2-step-standard"
 * @param {string} payoutType  - e.g. "standard", "weekly", "monthly"
 * @returns {Object} Detailed consistency analysis result
 */
function calculate(trades, accountType = "2-step-standard", payoutType = "standard") {
  if (!Array.isArray(trades) || trades.length === 0) {
    return emptyResult(accountType, payoutType);
  }

  const config = ACCOUNT_CONFIGS[accountType] || ACCOUNT_CONFIGS["2-step-standard"];
  const payoutConfig = PAYOUT_CONFIGS[payoutType] || PAYOUT_CONFIGS.standard;

  // Determine effective consistency cap
  // Payout type can override account type cap
  const cap =
    payoutConfig.consistencyCap !== null
      ? payoutConfig.consistencyCap
      : config.consistencyCap;

  // ── Build daily P&L map ──────────────────────
  const dailyPnL = buildDailyPnL(trades);
  const days = Object.keys(dailyPnL).sort();

  if (days.length === 0) {
    return emptyResult(accountType, payoutType, cap);
  }

  // ── Aggregate metrics ────────────────────────
  const allValues = Object.values(dailyPnL);
  const profitDays = allValues.filter((v) => v > 0);
  const lossDays = allValues.filter((v) => v < 0);

  const totalProfit = allValues.reduce((a, b) => a + b, 0);
  const bestDayProfit = profitDays.length > 0 ? Math.max(...profitDays) : 0;
  const worstDayLoss = lossDays.length > 0 ? Math.min(...lossDays) : 0;

  // Today's P&L (last trading day)
  const todayDate = days[days.length - 1];
  const todayPnL = dailyPnL[todayDate] || 0;

  // ── Consistency calculation ──────────────────
  let maxTodayAllowed = Infinity;
  let isViolating = false;
  let currentRatio = null;
  let violatingDay = null;

  if (cap !== null && totalProfit > 0) {
    // Core formula from FundingPips Technical Report:
    // maxToday = (cap × totalProfit) / (1 - cap) - max(todayPnL, 0)
    maxTodayAllowed = Math.max(
      0,
      (cap * totalProfit) / (1 - cap) - Math.max(todayPnL, 0)
    );

    // Check if any day violates the cap
    if (bestDayProfit > 0 && totalProfit > 0) {
      currentRatio = bestDayProfit / totalProfit;
      isViolating = currentRatio > cap;

      // Find which day is the violating day
      if (isViolating) {
        violatingDay = Object.entries(dailyPnL).find(
          ([, v]) => v === bestDayProfit
        )?.[0];
      }
    }
  }

  // ── Per-day analysis ─────────────────────────
  const dayAnalysis = days.map((date) => {
    const pnl = dailyPnL[date];
    const pctOfTotal = totalProfit > 0 ? (pnl / totalProfit) * 100 : 0;
    const isConsistencyViolation = cap !== null && totalProfit > 0 && pnl > 0 && pnl / totalProfit > cap;

    return {
      date,
      pnl: round2(pnl),
      pctOfTotal: round2(pctOfTotal),
      isConsistencyViolation,
      status: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "breakeven",
    };
  });

  // ── Streak calculation ───────────────────────
  const { winStreak, lossStreak } = calculateStreaks(allValues);

  // ── Final result ─────────────────────────────
  return {
    // Core consistency
    cap,
    hasConsistencyRule: cap !== null,
    isViolating,
    violatingDay,
    currentRatio: currentRatio !== null ? round4(currentRatio) : null,
    currentRatioPct: currentRatio !== null ? round2(currentRatio * 100) : null,
    maxTodayAllowed: maxTodayAllowed === Infinity ? null : round2(maxTodayAllowed),

    // Profit summary
    totalProfit: round2(totalProfit),
    bestDayProfit: round2(bestDayProfit),
    worstDayLoss: round2(worstDayLoss),
    todayPnL: round2(todayPnL),
    todayDate,

    // Day breakdown
    tradingDays: days.length,
    profitDays: profitDays.length,
    lossDays: lossDays.length,
    breakEvenDays: allValues.filter((v) => v === 0).length,

    // Streaks
    currentWinStreak: winStreak,
    currentLossStreak: lossStreak,

    // Detailed day analysis
    dailyPnL,
    dayAnalysis,

    // Meta
    accountType,
    payoutType,
    calculatedAt: new Date().toISOString(),

    // Risk alert
    alert: buildAlert(isViolating, currentRatio, cap, maxTodayAllowed, bestDayProfit, totalProfit),
  };
}

// ─────────────────────────────────────────────
// HELPER: Build daily P&L map from trades array
// ─────────────────────────────────────────────

function buildDailyPnL(trades) {
  const dailyPnL = {};

  for (const trade of trades) {
    // Support multiple field name conventions (TradeLocker, MT4, MT5)
    const pnl = parseFloat(
      trade.profit ?? trade.pnl ?? trade.realizedPnl ?? trade.netProfit ?? 0
    );

    // Parse close time (support ISO string, Unix ms, Unix s)
    let closeDate = "";
    const raw = trade.closeTime ?? trade.closedAt ?? trade.time ?? trade.date;

    if (raw) {
      let d;
      if (typeof raw === "number") {
        d = raw > 1e12 ? new Date(raw) : new Date(raw * 1000);
      } else {
        d = new Date(raw);
      }
      if (!isNaN(d.getTime())) {
        closeDate = d.toISOString().split("T")[0]; // YYYY-MM-DD
      }
    }

    if (!closeDate) continue;

    dailyPnL[closeDate] = (dailyPnL[closeDate] || 0) + pnl;
  }

  return dailyPnL;
}

// ─────────────────────────────────────────────
// HELPER: Calculate win/loss streaks
// ─────────────────────────────────────────────

function calculateStreaks(dailyValues) {
  let winStreak = 0, lossStreak = 0;
  let curWin = 0, curLoss = 0;

  for (const v of dailyValues) {
    if (v > 0) {
      curWin++;
      curLoss = 0;
    } else if (v < 0) {
      curLoss++;
      curWin = 0;
    } else {
      curWin = 0;
      curLoss = 0;
    }
    winStreak = Math.max(winStreak, curWin);
    lossStreak = Math.max(lossStreak, curLoss);
  }

  return { winStreak, lossStreak };
}

// ─────────────────────────────────────────────
// HELPER: Build human-readable alert message
// ─────────────────────────────────────────────

function buildAlert(isViolating, ratio, cap, maxToday, bestDay, totalProfit) {
  if (cap === null) return null;

  if (isViolating) {
    return {
      level: "critical",
      message: `🚨 Consistency Rule VIOLATED. Best day (${formatUSD(bestDay)}) = ${round2(ratio * 100)}% of total profit — exceeds ${cap * 100}% cap.`,
      action: "Contact FundingPips support or reduce profits on peak trading day.",
    };
  }

  if (ratio !== null && ratio > cap * 0.85) {
    return {
      level: "warning",
      message: `⚠️ Approaching consistency cap. Currently at ${round2(ratio * 100)}% (limit: ${cap * 100}%).`,
      action: maxToday !== null
        ? `Max additional profit today: ${formatUSD(maxToday)}`
        : "Be cautious with today's trading.",
    };
  }

  if (maxToday !== null && maxToday < 200) {
    return {
      level: "caution",
      message: `⚠️ Very limited profit headroom today: ${formatUSD(maxToday)}`,
      action: "Consider reducing position sizes or stopping early.",
    };
  }

  return {
    level: "ok",
    message: `✅ Consistency rule on track. ${cap * 100}% cap with ${ratio !== null ? round2(ratio * 100) + "% current ratio" : "no violations"}.`,
    action: maxToday !== null ? `Max profit today: ${formatUSD(maxToday)}` : null,
  };
}

// ─────────────────────────────────────────────
// HELPER: Empty result (no trades)
// ─────────────────────────────────────────────

function emptyResult(accountType, payoutType, cap = null) {
  return {
    cap,
    hasConsistencyRule: cap !== null,
    isViolating: false,
    violatingDay: null,
    currentRatio: null,
    currentRatioPct: null,
    maxTodayAllowed: null,
    totalProfit: 0,
    bestDayProfit: 0,
    worstDayLoss: 0,
    todayPnL: 0,
    todayDate: new Date().toISOString().split("T")[0],
    tradingDays: 0,
    profitDays: 0,
    lossDays: 0,
    breakEvenDays: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    dailyPnL: {},
    dayAnalysis: [],
    accountType,
    payoutType,
    calculatedAt: new Date().toISOString(),
    alert: { level: "ok", message: "No trade data yet.", action: null },
  };
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────

function round2(n) { return Math.round(n * 100) / 100; }
function round4(n) { return Math.round(n * 10000) / 10000; }
function formatUSD(n) { return `$${Math.abs(n).toFixed(2)}`; }

// ─────────────────────────────────────────────
// ADDITIONAL EXPORTS
// ─────────────────────────────────────────────

/**
 * calculateMaxTodayAllowed(totalProfit, todayPnL, cap)
 * Standalone helper for quick calculations
 */
function calculateMaxTodayAllowed(totalProfit, todayPnL, cap) {
  if (!cap || totalProfit <= 0) return null;
  return Math.max(0, (cap * totalProfit) / (1 - cap) - Math.max(todayPnL, 0));
}

/**
 * getAccountConfig(accountType)
 * Returns config for an account type
 */
function getAccountConfig(accountType) {
  return ACCOUNT_CONFIGS[accountType] || null;
}

/**
 * isConsistencyRuleActive(accountType, payoutType)
 * Quick check if consistency rule applies
 */
function isConsistencyRuleActive(accountType, payoutType = "standard") {
  const config = ACCOUNT_CONFIGS[accountType];
  const payout = PAYOUT_CONFIGS[payoutType];
  if (!config) return false;
  const cap = payout?.consistencyCap ?? config.consistencyCap;
  return cap !== null;
}

module.exports = {
  calculate,
  calculateMaxTodayAllowed,
  getAccountConfig,
  isConsistencyRuleActive,
  ACCOUNT_CONFIGS,
  PAYOUT_CONFIGS,
};
