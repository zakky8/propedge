/**
 * PropEdge Backend Server
 * Node.js + Express — Deploy on Railway ($5/month)
 *
 * Features:
 * - F3: Rule Acknowledgement API (Supabase PostgreSQL)
 * - F4: True Cost Calculator API
 * - F5: Consistency Rule Engine (TradeLocker API proxy)
 * - F6: News Window Feed (JBlanked + RapidAPI)
 * - AI Coach endpoints (Claude claude-sonnet-4-6 via Anthropic SDK)
 * - WebSocket for live trade updates
 * - Skills/Reports generation endpoints
 */

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk");
const http = require("http");
const WebSocket = require("ws");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const consistencyEngine = require("./consistency-engine");

require("dotenv").config();

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// Clients: supabase + anthropic
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));

// Rate limiting per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// Auth middleware — API key check for protected routes
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.PROPEDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

// ═════════════════════════════════════════════
// F3 — RULE ACKNOWLEDGEMENT SYSTEM
// ═════════════════════════════════════════════

/**
 * GET /api/rules
 * Fetch all active rules for a platform
 */
app.get("/api/rules", async (req, res) => {
  try {
    const { platform = "fundingpips", category } = req.query;
    let query = supabase
      .from("rules")
      .select("*")
      .eq("platform", platform)
      .eq("is_active", true)
      .order("effective_date", { ascending: false });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ rules: data, count: data.length });
  } catch (err) {
    console.error("[F3] GET /api/rules:", err.message);
    res.status(500).json({ error: "Failed to fetch rules" });
  }
});

/**
 * POST /api/rules/acknowledge
 * Record a trader's acknowledgement of a rule
 */
app.post("/api/rules/acknowledge", requireApiKey, async (req, res) => {
  try {
    const { trader_id, rule_id, platform, account_id, ip_address } = req.body;

    if (!trader_id || !rule_id) {
      return res.status(400).json({ error: "trader_id and rule_id required" });
    }

    // Check for existing acknowledgement
    const { data: existing } = await supabase
      .from("rule_acknowledgements")
      .select("id")
      .eq("trader_id", trader_id)
      .eq("rule_id", rule_id)
      .single();

    if (existing) {
      return res.json({ status: "already_acknowledged", id: existing.id });
    }

    const { data, error } = await supabase
      .from("rule_acknowledgements")
      .insert({
        trader_id,
        rule_id,
        platform: platform || "fundingpips",
        account_id: account_id || null,
        ip_address: ip_address || req.ip,
        acknowledged_at: new Date().toISOString(),
        user_agent: req.headers["user-agent"] || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit trail
    await supabase.from("audit_log").insert({
      event: "rule_acknowledged",
      trader_id,
      rule_id,
      metadata: { platform, account_id },
      created_at: new Date().toISOString(),
    });

    res.json({ status: "acknowledged", id: data.id, timestamp: data.acknowledged_at });
  } catch (err) {
    console.error("[F3] POST /api/rules/acknowledge:", err.message);
    res.status(500).json({ error: "Failed to record acknowledgement" });
  }
});

/**
 * GET /api/rules/pending/:traderId
 * Get all rules a trader hasn't acknowledged yet
 */
app.get("/api/rules/pending/:traderId", async (req, res) => {
  try {
    const { traderId } = req.params;
    const { platform = "fundingpips" } = req.query;

    // Get acknowledged rule IDs for this trader
    const { data: acks } = await supabase
      .from("rule_acknowledgements")
      .select("rule_id")
      .eq("trader_id", traderId);

    const acknowledgedIds = (acks || []).map((a) => a.rule_id);

    // Get all active rules NOT in acknowledged list
    let query = supabase
      .from("rules")
      .select("*")
      .eq("platform", platform)
      .eq("is_active", true);

    if (acknowledgedIds.length > 0) {
      query = query.not("id", "in", `(${acknowledgedIds.join(",")})`);
    }

    const { data: pendingRules, error } = await query;
    if (error) throw error;

    res.json({ pending: pendingRules, count: pendingRules.length });
  } catch (err) {
    console.error("[F3] GET /api/rules/pending:", err.message);
    res.status(500).json({ error: "Failed to fetch pending rules" });
  }
});

/**
 * POST /api/rules (admin — create new rule)
 */
app.post("/api/rules", requireApiKey, async (req, res) => {
  try {
    const { title, description, category, effective_date, platform, severity } = req.body;

    const { data, error } = await supabase
      .from("rules")
      .insert({
        title,
        description,
        category: category || "general",
        effective_date: effective_date || new Date().toISOString(),
        platform: platform || "fundingpips",
        severity: severity || "medium",
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ rule: data });
  } catch (err) {
    console.error("[F3] POST /api/rules:", err.message);
    res.status(500).json({ error: "Failed to create rule" });
  }
});

// ═════════════════════════════════════════════
// F4 — TRUE COST CALCULATOR
// ═════════════════════════════════════════════

// Instrument configuration (verified data from Technical Report)
const INSTRUMENTS = {
  EURUSD: { spread: 0.2, pipValue: 10, commission: 2.0, digits: 5, minLot: 0.01 },
  GBPUSD: { spread: 0.4, pipValue: 10, commission: 2.0, digits: 5, minLot: 0.01 },
  USDJPY: { spread: 0.3, pipValue: 9.1, commission: 2.0, digits: 3, minLot: 0.01 },
  XAUUSD: { spread: 0.18, pipValue: 10, commission: 3.0, digits: 2, minLot: 0.01, unit: "$/0.1pt" },
  XAGUSD: { spread: 0.35, pipValue: 50, commission: 3.0, digits: 3, minLot: 0.01,
    warning: "⚠️ XAG pip value = $50/lot (5× EURUSD). 2.5 lots wipes entire 5% daily limit via spread alone.",
    unit: "$/0.01pt" },
  USOIL:  { spread: 0.05, pipValue: 10, commission: 2.5, digits: 3, minLot: 0.01 },
  BTCUSD: { spread: 15, pipValue: 1, commission: 5.0, digits: 1, minLot: 0.01 },
  ETHUSD: { spread: 1.5, pipValue: 1, commission: 3.0, digits: 2, minLot: 0.1 },
  US30:   { spread: 0.8, pipValue: 1, commission: 2.0, digits: 1, minLot: 0.1 },
  NAS100: { spread: 0.4, pipValue: 1, commission: 2.0, digits: 1, minLot: 0.1 },
  SP500:  { spread: 0.3, pipValue: 1, commission: 2.0, digits: 2, minLot: 0.1 },
  GER40:  { spread: 0.5, pipValue: 1, commission: 2.0, digits: 1, minLot: 0.1 },
};

// Account type configurations
const ACCOUNT_CONFIGS = {
  "2-step-standard": { dailyLimitPct: 0.05, maxLossPct: 0.10, consistencyCap: null },
  "2-step-pro":      { dailyLimitPct: 0.03, maxLossPct: 0.06, consistencyCap: null },
  "1-step":          { dailyLimitPct: 0.05, maxLossPct: 0.10, consistencyCap: null },
  "zero":            { dailyLimitPct: 0.03, maxLossPct: 0.06, consistencyCap: 0.15 },
  "on-demand":       { dailyLimitPct: null, maxLossPct: 0.10, consistencyCap: 0.35 },
  "pro":             { dailyLimitPct: null, maxLossPct: 0.10, consistencyCap: 0.45 },
};

/**
 * POST /api/cost/calculate
 * Calculate true entry cost including spread + commission
 */
app.post("/api/cost/calculate", (req, res) => {
  try {
    const { instrument, lotSize, accountType, accountSize } = req.body;

    if (!instrument || !INSTRUMENTS[instrument]) {
      return res.status(400).json({ error: `Unknown instrument: ${instrument}` });
    }

    const inst = INSTRUMENTS[instrument];
    const config = ACCOUNT_CONFIGS[accountType] || ACCOUNT_CONFIGS["2-step-standard"];
    const lots = parseFloat(lotSize) || 1.0;
    const size = parseFloat(accountSize) || 10000;

    const spreadCost = inst.spread * inst.pipValue * lots;
    const commission = inst.commission * lots;
    const totalEntry = spreadCost + commission;
    const roundTrip = totalEntry * 2;
    const dailyLimitUSD = config.dailyLimitPct ? config.dailyLimitPct * size : null;
    const pctOfDailyLimit = dailyLimitUSD ? (totalEntry / dailyLimitUSD) * 100 : null;
    const breakEvenPips = totalEntry / (inst.pipValue * lots);

    const result = {
      instrument,
      lots,
      spreadCost: parseFloat(spreadCost.toFixed(2)),
      commission: parseFloat(commission.toFixed(2)),
      totalEntryCost: parseFloat(totalEntry.toFixed(2)),
      roundTripCost: parseFloat(roundTrip.toFixed(2)),
      breakEvenPips: parseFloat(breakEvenPips.toFixed(1)),
      dailyLimitUSD: dailyLimitUSD ? parseFloat(dailyLimitUSD.toFixed(2)) : null,
      pctOfDailyLimit: pctOfDailyLimit ? parseFloat(pctOfDailyLimit.toFixed(2)) : null,
      warning: inst.warning || null,
      riskLevel:
        pctOfDailyLimit >= 25 ? "critical" :
        pctOfDailyLimit >= 10 ? "high" :
        pctOfDailyLimit >= 5  ? "medium" : "low",
    };

    res.json(result);
  } catch (err) {
    console.error("[F4] POST /api/cost/calculate:", err.message);
    res.status(500).json({ error: "Calculation failed" });
  }
});

/**
 * GET /api/cost/instruments
 * Return list of instruments with pip values
 */
app.get("/api/cost/instruments", (req, res) => {
  const list = Object.entries(INSTRUMENTS).map(([symbol, data]) => ({
    symbol,
    spread: data.spread,
    pipValue: data.pipValue,
    commission: data.commission,
    warning: data.warning || null,
  }));
  res.json({ instruments: list });
});

// ═════════════════════════════════════════════
// F5 — CONSISTENCY RULE ENGINE
// ═════════════════════════════════════════════

/**
 * POST /api/consistency/calculate
 * Calculate consistency status for a trader
 * Uses local engine — no TradeLocker dependency for demo mode
 */
app.post("/api/consistency/calculate", (req, res) => {
  try {
    const { trades, accountType, payoutType } = req.body;

    if (!trades || !Array.isArray(trades)) {
      return res.status(400).json({ error: "trades array required" });
    }

    const result = consistencyEngine.calculate(trades, accountType, payoutType);
    res.json(result);
  } catch (err) {
    console.error("[F5] POST /api/consistency/calculate:", err.message);
    res.status(500).json({ error: "Consistency calculation failed" });
  }
});

/**
 * GET /api/consistency/live/:accountId
 * Fetch live trade data from TradeLocker and compute consistency
 */
app.get("/api/consistency/live/:accountId", requireApiKey, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountType = "2-step-standard", payoutType = "standard" } = req.query;

    // 1. Get TradeLocker JWT
    const tlToken = await getTradeLockerToken();

    // 2. Fetch trade history from TradeLocker REST API
    const tlRes = await axios.get(
      `${process.env.TRADELOCKER_BASE_URL}/trade/accounts/${accountId}/ordersHistory`,
      {
        headers: { Authorization: `Bearer ${tlToken}` },
        params: { limit: 500 },
      }
    );

    const trades = tlRes.data.d?.ordersHistory || [];

    // 3. Run consistency engine
    const result = consistencyEngine.calculate(trades, accountType, payoutType);

    res.json({
      ...result,
      accountId,
      source: "tradelocker",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[F5] GET /api/consistency/live:", err.message);
    res.status(500).json({ error: "Live data fetch failed", detail: err.message });
  }
});

// ═════════════════════════════════════════════
// F6 — NEWS WINDOW DISPLAY
// ═════════════════════════════════════════════

// In-memory news cache (refreshed every 15 min)
let newsCache = { data: [], lastFetch: null };

async function fetchNewsEvents() {
  const now = Date.now();
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  if (newsCache.data.length && newsCache.lastFetch && now - newsCache.lastFetch < CACHE_TTL) {
    return newsCache.data;
  }

  try {
    // Primary: JBlanked Forex Factory API (free, verified)
    const res = await axios.get(
      "https://jblanked.com/news/api/forex-factory/calendar/today/",
      {
        params: { impact: "High" },
        timeout: 8000,
        headers: { "User-Agent": "PropEdge/1.0" },
      }
    );
    const events = Array.isArray(res.data) ? res.data : res.data.events || [];
    newsCache = { data: events, lastFetch: now };
    return events;
  } catch (err) {
    console.warn("[F6] JBlanked failed, trying RapidAPI fallback:", err.message);

    // Fallback: RapidAPI Economic Calendar
    try {
      const fbRes = await axios.get(
        "https://economic-calendar.p.rapidapi.com/events",
        {
          params: { from: new Date().toISOString().split("T")[0], impact: "3" },
          headers: {
            "x-rapidapi-host": "economic-calendar.p.rapidapi.com",
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          },
          timeout: 8000,
        }
      );
      const fbEvents = fbRes.data.events || fbRes.data || [];
      newsCache = { data: fbEvents, lastFetch: now };
      return fbEvents;
    } catch (fbErr) {
      console.error("[F6] Both news APIs failed:", fbErr.message);
      return newsCache.data || []; // Return stale if available
    }
  }
}

/**
 * GET /api/news
 * Get today's high-impact news events
 */
app.get("/api/news", async (req, res) => {
  try {
    const { impact = "High", currency } = req.query;
    let events = await fetchNewsEvents();

    if (currency) {
      events = events.filter((e) =>
        (e.currency || e.country || "").toUpperCase().includes(currency.toUpperCase())
      );
    }

    // Normalize event structure
    const normalized = events.map((e) => ({
      id: e.id || `${e.time}-${e.title}`.replace(/\s/g, "-"),
      title: e.title || e.name || "Unknown Event",
      time: e.time || e.date || "",
      currency: e.currency || e.country || "",
      impact: e.impact || impact,
      forecast: e.forecast || null,
      previous: e.previous || null,
      actual: e.actual || null,
      windowMinutes: getNewsWindow(e.impact || impact),
    }));

    res.json({
      events: normalized,
      count: normalized.length,
      fetchedAt: newsCache.lastFetch ? new Date(newsCache.lastFetch).toISOString() : null,
      source: "forex-factory",
    });
  } catch (err) {
    console.error("[F6] GET /api/news:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

/**
 * GET /api/news/risk-check
 * Check if current time is within a news window for given currency pairs
 */
app.get("/api/news/risk-check", async (req, res) => {
  try {
    const { currencies = "USD,EUR,GBP" } = req.query;
    const currencyList = currencies.split(",").map((c) => c.trim().toUpperCase());

    const events = await fetchNewsEvents();
    const nowUTC = new Date();

    const activeWindows = events
      .filter((e) => {
        const cur = (e.currency || e.country || "").toUpperCase();
        return currencyList.some((c) => cur.includes(c));
      })
      .map((e) => {
        const eventTime = new Date(e.time || e.date);
        const windowMins = getNewsWindow(e.impact);
        const windowStart = new Date(eventTime.getTime() - windowMins * 60 * 1000);
        const windowEnd = new Date(eventTime.getTime() + windowMins * 60 * 1000);
        const isActive = nowUTC >= windowStart && nowUTC <= windowEnd;
        const minutesUntil = Math.round((eventTime - nowUTC) / 60000);

        return {
          id: e.id || e.title,
          title: e.title || e.name,
          time: eventTime.toISOString(),
          currency: e.currency || e.country,
          impact: e.impact,
          windowMins,
          isActive,
          minutesUntil,
          recommendation: isActive
            ? "⛔ AVOID TRADING — Active news window"
            : minutesUntil > 0 && minutesUntil <= 30
            ? "⚠️ NEWS APPROACHING — Consider closing positions"
            : null,
        };
      });

    const hasActiveRisk = activeWindows.some((w) => w.isActive);
    const hasApproachingRisk = activeWindows.some(
      (w) => w.minutesUntil > 0 && w.minutesUntil <= 30
    );

    res.json({
      riskLevel: hasActiveRisk ? "critical" : hasApproachingRisk ? "warning" : "clear",
      activeWindows: activeWindows.filter((w) => w.recommendation),
      allUpcoming: activeWindows,
      checkedAt: nowUTC.toISOString(),
    });
  } catch (err) {
    console.error("[F6] GET /api/news/risk-check:", err.message);
    res.status(500).json({ error: "Risk check failed" });
  }
});

function getNewsWindow(impact) {
  switch ((impact || "").toLowerCase()) {
    case "high":   return 15;
    case "medium": return 10;
    default:       return 5;
  }
}

// ═════════════════════════════════════════════
// AI COACH — Anthropic SDK Integration
// ═════════════════════════════════════════════

/**
 * POST /api/coach/analyze
 * AI-powered trade analysis and coaching using Claude
 */
app.post("/api/coach/analyze", requireApiKey, async (req, res) => {
  try {
    const { trades, accountType, accountSize, question } = req.body;

    const consistencyData = trades
      ? consistencyEngine.calculate(trades, accountType, "standard")
      : null;

    const systemPrompt = `You are PropEdge AI Coach — an expert prop trading analyst specializing in FundingPips challenge rules.

You have deep knowledge of:
- FundingPips account types: 2-Step Standard/Pro, 1-Step, Zero, On-Demand, Pro
- Consistency rules: Zero=15% cap, On-Demand=35%, Pro=45%
- Daily loss limits: 2-step-standard=5%, 2-step-pro=3%, 1-step=5%, zero=3%
- XAG (Silver) pip value = $50/lot (5× EURUSD) — critical risk
- News trading restrictions (High impact = ±15 min window)
- TradeLocker platform mechanics

Give specific, actionable advice. Be direct and concise. Flag any rule violations immediately.
Always calculate numbers precisely when providing advice.`;

    const userMessage = question
      ? `${question}\n\nAccount: ${accountType || "unknown"} $${accountSize || "unknown"}\n\nTrade data: ${JSON.stringify(consistencyData || {}, null, 2)}`
      : `Analyze my trading performance for a ${accountType} $${accountSize} account:\n\n${JSON.stringify(consistencyData || trades || {}, null, 2)}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    res.json({
      analysis: message.content[0].text,
      model: message.model,
      usage: message.usage,
      consistencySnapshot: consistencyData
        ? {
            totalProfit: consistencyData.totalProfit,
            isViolating: consistencyData.isViolating,
            currentRatio: consistencyData.currentRatio,
            cap: consistencyData.cap,
          }
        : null,
    });
  } catch (err) {
    console.error("[Coach] POST /api/coach/analyze:", err.message);
    res.status(500).json({ error: "AI analysis failed", detail: err.message });
  }
});

/**
 * POST /api/coach/stream
 * Streaming AI coaching response (SSE)
 */
app.post("/api/coach/stream", requireApiKey, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { question, accountType, accountSize, trades } = req.body;

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are PropEdge AI Coach — expert in FundingPips prop trading rules, consistency calculations, and risk management. Be direct and specific.`,
      messages: [
        {
          role: "user",
          content: `${question} [Account: ${accountType} $${accountSize}]`,
        },
      ],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta?.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ═════════════════════════════════════════════
// ANALYTICS — Financial Metrics
// ═════════════════════════════════════════════

/**
 * POST /api/analytics/metrics
 * Calculate advanced trading metrics (Sharpe, Sortino, Max Drawdown)
 */
app.post("/api/analytics/metrics", (req, res) => {
  try {
    const { trades, accountSize, riskFreeRate = 0.05 } = req.body;

    if (!trades || trades.length === 0) {
      return res.status(400).json({ error: "trades array required" });
    }

    const returns = trades.map((t) => parseFloat(t.pnl || t.profit || 0));
    const n = returns.length;

    const totalReturn = returns.reduce((a, b) => a + b, 0);
    const avgReturn = totalReturn / n;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Sharpe Ratio (annualized, assuming daily trades)
    const sharpe = stdDev > 0 ? ((avgReturn - riskFreeRate / 252) / stdDev) * Math.sqrt(252) : 0;

    // Sortino Ratio (downside deviation only)
    const downside = returns.filter((r) => r < 0);
    const downsideVariance = downside.length > 0
      ? downside.reduce((a, b) => a + Math.pow(b, 2), 0) / downside.length
      : 0;
    const downsideStdDev = Math.sqrt(downsideVariance);
    const sortino = downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(252) : 0;

    // Max Drawdown
    let peak = 0, maxDrawdown = 0, runningPnL = 0;
    for (const r of returns) {
      runningPnL += r;
      if (runningPnL > peak) peak = runningPnL;
      const dd = peak - runningPnL;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Win rate + profit factor
    const winners = returns.filter((r) => r > 0);
    const losers = returns.filter((r) => r < 0);
    const winRate = (winners.length / n) * 100;
    const grossProfit = winners.reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(losers.reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    res.json({
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      totalReturnPct: accountSize ? parseFloat(((totalReturn / accountSize) * 100).toFixed(2)) : null,
      avgReturn: parseFloat(avgReturn.toFixed(2)),
      sharpeRatio: parseFloat(sharpe.toFixed(2)),
      sortinoRatio: parseFloat(sortino.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      maxDrawdownPct: accountSize ? parseFloat(((maxDrawdown / accountSize) * 100).toFixed(2)) : null,
      winRate: parseFloat(winRate.toFixed(1)),
      profitFactor: parseFloat(Math.min(profitFactor, 99.99).toFixed(2)),
      totalTrades: n,
      winners: winners.length,
      losers: losers.length,
      stdDev: parseFloat(stdDev.toFixed(2)),
    });
  } catch (err) {
    console.error("[Analytics] POST /api/analytics/metrics:", err.message);
    res.status(500).json({ error: "Metrics calculation failed" });
  }
});

// ═════════════════════════════════════════════
// REPORTS — Skills Integration
// ═════════════════════════════════════════════

/**
 * POST /api/reports/generate
 * Trigger report generation (PDF/XLSX/PPTX/DOCX via Skills)
 * Returns job ID for async polling
 */
app.post("/api/reports/generate", requireApiKey, async (req, res) => {
  try {
    const { type, traderId, accountId, dateRange, format = "pdf" } = req.body;

    // Create report job in Supabase
    const { data: job, error } = await supabase
      .from("report_jobs")
      .insert({
        type,
        trader_id: traderId,
        account_id: accountId,
        date_range: dateRange,
        format,
        status: "queued",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger async report generation (worker picks this up)
    res.status(202).json({
      jobId: job.id,
      status: "queued",
      estimatedSeconds: format === "pdf" ? 5 : format === "xlsx" ? 8 : 12,
      pollUrl: `/api/reports/status/${job.id}`,
    });
  } catch (err) {
    console.error("[Reports] POST /api/reports/generate:", err.message);
    res.status(500).json({ error: "Failed to queue report" });
  }
});

/**
 * GET /api/reports/status/:jobId
 */
app.get("/api/reports/status/:jobId", requireApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("report_jobs")
      .select("*")
      .eq("id", req.params.jobId)
      .single();

    if (error || !data) return res.status(404).json({ error: "Job not found" });

    res.json({
      jobId: data.id,
      status: data.status,
      downloadUrl: data.download_url || null,
      createdAt: data.created_at,
      completedAt: data.completed_at || null,
      error: data.error_message || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Status check failed" });
  }
});

// ═════════════════════════════════════════════
// TRADELOCKER PROXY — Auth Helper
// ═════════════════════════════════════════════

let tlTokenCache = { token: null, expiry: null };

async function getTradeLockerToken() {
  const now = Date.now();
  if (tlTokenCache.token && tlTokenCache.expiry && now < tlTokenCache.expiry) {
    return tlTokenCache.token;
  }

  const res = await axios.post(
    `${process.env.TRADELOCKER_BASE_URL}/auth/jwt/token`,
    {
      email: process.env.TRADELOCKER_EMAIL,
      password: process.env.TRADELOCKER_PASSWORD,
      server: process.env.TRADELOCKER_SERVER,
    }
  );

  const token = res.data.accessToken || res.data.d?.accessToken;
  if (!token) throw new Error("TradeLocker: no token in response");

  tlTokenCache = { token, expiry: now + 60 * 60 * 1000 }; // 1-hour TTL
  return token;
}

/**
 * POST /api/tradelocker/auth
 * Authenticate a trader with TradeLocker (proxied, keeps credentials server-side)
 */
app.post("/api/tradelocker/auth", requireApiKey, async (req, res) => {
  try {
    const { email, password, server } = req.body;

    const tlRes = await axios.post(
      `${process.env.TRADELOCKER_BASE_URL}/auth/jwt/token`,
      { email, password, server }
    );

    const { accessToken, refreshToken } = tlRes.data;
    res.json({ accessToken, refreshToken, expiresIn: 3600 });
  } catch (err) {
    console.error("[TL] POST /api/tradelocker/auth:", err.message);
    res.status(401).json({ error: "TradeLocker authentication failed" });
  }
});

/**
 * GET /api/tradelocker/accounts
 */
app.get("/api/tradelocker/accounts", requireApiKey, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No auth token" });

    const tlRes = await axios.get(
      `${process.env.TRADELOCKER_BASE_URL}/trade/accounts`,
      { headers: { Authorization: authHeader } }
    );
    res.json(tlRes.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch accounts", detail: err.message });
  }
});

// ═════════════════════════════════════════════
// WEBSOCKET — Live Trade Updates
// ═════════════════════════════════════════════

const wsClients = new Map(); // accountId → Set<ws>

wss.on("connection", (ws, req) => {
  let accountId = null;
  console.log(`[WS] New connection from ${req.socket.remoteAddress}`);

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "subscribe") {
        accountId = data.accountId;
        if (!wsClients.has(accountId)) wsClients.set(accountId, new Set());
        wsClients.get(accountId).add(ws);

        ws.send(JSON.stringify({ type: "subscribed", accountId }));
        console.log(`[WS] Subscribed: ${accountId}`);

        // Start news polling for this client
        pollNewsForClient(ws, accountId);
      }

      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      }
    } catch (e) {
      console.error("[WS] Message parse error:", e.message);
    }
  });

  ws.on("close", () => {
    if (accountId && wsClients.has(accountId)) {
      wsClients.get(accountId).delete(ws);
      if (wsClients.get(accountId).size === 0) wsClients.delete(accountId);
    }
    console.log(`[WS] Disconnected: ${accountId}`);
  });

  ws.on("error", (err) => console.error("[WS] Error:", err.message));
});

async function pollNewsForClient(ws, accountId) {
  const interval = setInterval(async () => {
    if (ws.readyState !== WebSocket.OPEN) {
      clearInterval(interval);
      return;
    }
    try {
      const events = await fetchNewsEvents();
      const nowUTC = new Date();
      const critical = events.filter((e) => {
        const t = new Date(e.time || e.date);
        const mins = Math.round((t - nowUTC) / 60000);
        return mins >= -5 && mins <= 30 && (e.impact || "").toLowerCase() === "high";
      });
      if (critical.length > 0) {
        ws.send(JSON.stringify({ type: "news_alert", events: critical, timestamp: nowUTC.toISOString() }));
      }
    } catch (_) {}
  }, 60000); // Poll every 60 seconds
}

// Broadcast to all subscribers of an account
function broadcast(accountId, payload) {
  const clients = wsClients.get(accountId);
  if (!clients) return;
  const msg = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

// ═════════════════════════════════════════════
// COMMUNITY — Leaderboard + Badges
// ═════════════════════════════════════════════

app.get("/api/community/leaderboard", async (req, res) => {
  try {
    const { limit = 10, period = "weekly" } = req.query;
    const { data, error } = await supabase
      .from("leaderboard")
      .select("trader_id, display_name, return_pct, win_rate, profit_factor, badge")
      .eq("period", period)
      .order("return_pct", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ leaderboard: data, period });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ═════════════════════════════════════════════
// ERROR HANDLER
// ═════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ═════════════════════════════════════════════
// START
// ═════════════════════════════════════════════
server.listen(PORT, () => {
  console.log(`PropEdge server running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

module.exports = { app, server, broadcast };
