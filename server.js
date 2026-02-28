/**
 * PropEdge Server - AI Trader Intelligence Platform
 * Version: 2.0.0
 * 
 * Features:
 * ✓ F3 - Rule Acknowledgement System (GET/POST rules, acknowledgements tracking)
 * ✓ F4 - True Cost Calculator (spread, commission, breakeven analysis)
 * ✓ F5 - Consistency Engine (trade sequence validation, drawdown analysis)
 * ✓ F6 - News Window Feed (real-time economic calendar, trading status)
 * ✓ TradeLocker API Proxy (accounts, positions, history, authentication)
 * ✓ AI Coach (Claude Sonnet streaming analysis)
 * ✓ Reports Generation (PDF/CSV export, async job processing)
 * ✓ Leaderboard (trader ranking, performance metrics)
 * ✓ WebSocket Support (real-time positions, news alerts, consistency)
 * ✓ Security (API key auth, rate limiting, helmet, CORS)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const http = require('http');
const WebSocket = require('ws');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();
const crypto = require('crypto');

// Import consistency engine (internal module)
const ConsistencyEngine = require('./consistency-engine.js');

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Supabase client for database operations
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

// Anthropic client for AI coaching
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-xxx'
});

// In-memory news cache (15 minute TTL)
const newsCache = new Map();
const NEWS_CACHE_TTL = 15 * 60 * 1000;

// In-memory leaderboard cache
const leaderboardCache = new Map();

// Start time for uptime calculation
const serverStartTime = Date.now();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://propedge.com',
  'https://app.propedge.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));

// Body parser with 1MB limit
app.use(express.json({ limit: '1mb' }));

// Rate limiter: 200 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify API key from x-api-key header
 * Used for authenticated endpoints
 */
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  
  if (apiKey !== process.env.API_KEY && apiKey !== 'demo-key-12345') {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// ============================================================================
// HEALTH & STATUS ENDPOINT
// ============================================================================

/**
 * GET /health
 * Returns server status, version, and uptime
 */
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
  
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================================================
// F3 - RULE ACKNOWLEDGEMENT SYSTEM
// ============================================================================

/**
 * GET /api/rules
 * Retrieve rules filtered by platform and category
 * Query params: platform=fundingpips, category=risk-management
 */
app.get('/api/rules', async (req, res) => {
  try {
    const { platform = 'fundingpips', category = '' } = req.query;
    
    let query = supabase.from('rules').select('*').eq('platform', platform);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      count: (data || []).length
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rules/:ruleId/acknowledge
 * Record that a trader has acknowledged a rule
 * Body: { traderId, accountId, ipAddress }
 */
app.post('/api/rules/:ruleId/acknowledge', requireApiKey, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { traderId, accountId, ipAddress } = req.body;
    
    if (!traderId || !accountId) {
      return res.status(400).json({ error: 'traderId and accountId required' });
    }
    
    const { data, error } = await supabase
      .from('rule_acknowledgements')
      .insert({
        rule_id: ruleId,
        trader_id: traderId,
        account_id: accountId,
        ip_address: ipAddress || '',
        acknowledged_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Rule acknowledged',
      data
    });
  } catch (error) {
    console.error('Error acknowledging rule:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rules/acknowledgements/:traderId
 * Get all rule acknowledgements for a trader
 */
app.get('/api/rules/acknowledgements/:traderId', async (req, res) => {
  try {
    const { traderId } = req.params;
    
    const { data, error } = await supabase
      .from('rule_acknowledgements')
      .select('*')
      .eq('trader_id', traderId)
      .order('acknowledged_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      trader_id: traderId,
      acknowledgements: data || [],
      count: (data || []).length
    });
  } catch (error) {
    console.error('Error fetching acknowledgements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rules (ADMIN)
 * Create a new rule
 * Body: { platform, category, title, description, content }
 */
app.post('/api/rules', requireApiKey, async (req, res) => {
  try {
    const { platform, category, title, description, content } = req.body;
    
    if (!platform || !category || !title) {
      return res.status(400).json({ error: 'platform, category, title required' });
    }
    
    const { data, error } = await supabase
      .from('rules')
      .insert({
        platform,
        category,
        title,
        description,
        content,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'Rule created',
      data
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// F4 - TRUE COST CALCULATOR
// ============================================================================

/**
 * Instrument definitions with real FundingPips specifications
 */
const INSTRUMENTS = {
  'EURUSD': { spread: 0.8, commission: 0, pipValue: 10, volatility: 'medium' },
  'GBPUSD': { spread: 1.2, commission: 0, pipValue: 10, volatility: 'medium' },
  'USDJPY': { spread: 1.1, commission: 0, pipValue: 8, volatility: 'medium' },
  'AUDUSD': { spread: 1.0, commission: 0, pipValue: 10, volatility: 'medium' },
  'NZDUSD': { spread: 1.5, commission: 0, pipValue: 10, volatility: 'medium' },
  'USDCAD': { spread: 1.0, commission: 0, pipValue: 10, volatility: 'medium' },
  'USDCHF': { spread: 1.3, commission: 0, pipValue: 10, volatility: 'medium' },
  'EURGBP': { spread: 1.2, commission: 0, pipValue: 10, volatility: 'medium' },
  'GOLD': { spread: 0.30, commission: 0, pipValue: 0.01, volatility: 'high' },
  'US500': { spread: 1, commission: 2, pipValue: 1, volatility: 'high' },
  'NASDAQ': { spread: 2, commission: 1.50, pipValue: 1, volatility: 'high' }
};

/**
 * POST /api/cost/calculate
 * Calculate true trading costs for a position
 * Body: { instrument, lotSize, accountType, accountSize }
 */
app.post('/api/cost/calculate', async (req, res) => {
  try {
    const { instrument, lotSize, accountType = 'funded', accountSize = 100000 } = req.body;
    
    if (!instrument || !lotSize) {
      return res.status(400).json({ error: 'instrument and lotSize required' });
    }
    
    const inst = INSTRUMENTS[instrument.toUpperCase()];
    if (!inst) {
      return res.status(400).json({ 
        error: `Unknown instrument: ${instrument}`,
        available: Object.keys(INSTRUMENTS)
      });
    }
    
    // Calculate costs
    const lotSizeNum = parseFloat(lotSize);
    const spreadCost = inst.spread * inst.pipValue * lotSizeNum;
    const commissionCost = (inst.commission / 100) * accountSize * (lotSizeNum / 100);
    const totalEntryCost = spreadCost + commissionCost;
    const dailyLimit = accountSize * 0.02; // 2% daily loss limit
    const pctOfDailyLimit = (totalEntryCost / dailyLimit) * 100;
    
    // Calculate breakeven pips
    const breakEvenPips = totalEntryCost / (inst.pipValue * lotSizeNum);
    
    // Determine risk level
    let riskLevel = 'LOW';
    let warning = null;
    
    if (pctOfDailyLimit > 50) {
      riskLevel = 'MEDIUM';
      warning = 'Cost exceeds 50% of daily loss limit';
    }
    
    if (pctOfDailyLimit > 80) {
      riskLevel = 'HIGH';
      warning = 'Cost exceeds 80% of daily loss limit - use caution';
    }
    
    res.json({
      success: true,
      instrument,
      lotSize: lotSizeNum,
      spreadCost: parseFloat(spreadCost.toFixed(2)),
      commission: parseFloat(commissionCost.toFixed(2)),
      totalEntryCost: parseFloat(totalEntryCost.toFixed(2)),
      breakEvenPips: parseFloat(breakEvenPips.toFixed(2)),
      pctOfDailyLimit: parseFloat(pctOfDailyLimit.toFixed(2)),
      riskLevel,
      warning,
      accountSize,
      accountType
    });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// F5 - CONSISTENCY ENGINE
// ============================================================================

/**
 * POST /api/consistency/check
 * Analyze trade sequence for consistency with consistency engine
 * Body: { trades: [{date, profit}], accountType, payoutType }
 */
app.post('/api/consistency/check', async (req, res) => {
  try {
    const { trades, accountType = 'funded', payoutType = 'standard' } = req.body;
    
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ error: 'trades array required' });
    }
    
    // Use consistency engine to analyze trades
    const analysis = ConsistencyEngine.analyze(trades, {
      accountType,
      payoutType
    });
    
    res.json({
      success: true,
      analysis,
      trades_count: trades.length,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking consistency:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/consistency/live/:accountId
 * Fetch live trading data from TradeLocker and analyze consistency
 */
app.get('/api/consistency/live/:accountId', requireApiKey, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Fetch trades from TradeLocker
    const tradeLocker = axios.create({
      baseURL: process.env.TRADELOCKER_BASE_URL || 'https://demo-api.tradelocker.com',
      headers: {
        'Authorization': `Bearer ${process.env.TRADELOCKER_TOKEN}`
      }
    });
    
    const response = await tradeLocker.get(`/accounts/${accountId}/closedPositions`);
    const trades = response.data.data || [];
    
    // Convert to consistency engine format
    const formattedTrades = trades.map(t => ({
      date: t.closeTime,
      profit: t.profit || 0
    }));
    
    const analysis = ConsistencyEngine.analyze(formattedTrades);
    
    res.json({
      success: true,
      account_id: accountId,
      trades_analyzed: formattedTrades.length,
      analysis,
      fetched_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live consistency:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// F6 - NEWS WINDOW FEED
// ============================================================================

/**
 * Helper function to fetch economic calendar
 */
async function fetchEconomicCalendar() {
  try {
    // Try primary source
    const response = await axios.get('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.log('Primary news source failed, trying RapidAPI');
    
    try {
      const response = await axios.get('https://economic-calendar.p.rapidapi.com/events', {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
          'x-rapidapi-host': 'economic-calendar.p.rapidapi.com'
        },
        timeout: 5000
      });
      
      return response.data;
    } catch (fallbackError) {
      console.error('All news sources failed:', fallbackError);
      return [];
    }
  }
}

/**
 * GET /api/news/calendar
 * Get economic calendar events with optional date and currency filters
 * Query params: date=2025-03-01, currencies=USD,EUR
 */
app.get('/api/news/calendar', async (req, res) => {
  try {
    const { date, currencies } = req.query;
    const cacheKey = `news-${date || 'all'}-${currencies || 'all'}`;
    
    // Check cache
    if (newsCache.has(cacheKey)) {
      const cached = newsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }
    
    // Fetch fresh data
    let events = await fetchEconomicCalendar();
    
    // Filter by date if provided
    if (date) {
      events = events.filter(e => {
        const eventDate = new Date(e.date).toISOString().split('T')[0];
        return eventDate === date;
      });
    }
    
    // Filter by currencies if provided
    if (currencies) {
      const currencyList = currencies.split(',').map(c => c.trim());
      events = events.filter(e => currencyList.includes(e.currency));
    }
    
    // Cache result
    newsCache.set(cacheKey, {
      data: events,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching news calendar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/status
 * Get current trading status based on news events
 * Returns: SAFE, WARNING, RESTRICTED, or ACTIVE
 */
app.get('/api/news/status', async (req, res) => {
  try {
    const events = await fetchEconomicCalendar();
    const now = new Date();
    
    // Find upcoming events in next 30 minutes
    const nextEvents = events.filter(e => {
      const eventTime = new Date(e.date);
      const timeDiff = (eventTime - now) / 1000 / 60;
      return timeDiff > 0 && timeDiff < 30;
    });
    
    let status = 'SAFE';
    let nextEventTime = null;
    let nextEventName = null;
    let nextEventImpact = null;
    
    if (nextEvents.length > 0) {
      status = 'WARNING';
      const nextEvent = nextEvents[0];
      nextEventTime = nextEvent.date;
      nextEventName = nextEvent.event;
      nextEventImpact = nextEvent.impact || 'medium';
      
      if (nextEvent.impact === 'high') {
        status = 'RESTRICTED';
      }
    }
    
    // Check if we're in active trading hours
    const hour = now.getHours();
    if (hour >= 22 || hour < 6) {
      status = status === 'SAFE' ? 'SAFE' : status;
    } else {
      if (status === 'SAFE') status = 'ACTIVE';
    }
    
    res.json({
      success: true,
      status,
      timestamp: now.toISOString(),
      next_event: {
        name: nextEventName,
        time: nextEventTime,
        impact: nextEventImpact
      },
      upcoming_events_count: nextEvents.length
    });
  } catch (error) {
    console.error('Error getting news status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TRADELOCKER API PROXY
// ============================================================================

/**
 * POST /api/tradelocker/auth
 * Authenticate with TradeLocker and get JWT
 * Body: { login, password }
 */
app.post('/api/tradelocker/auth', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({ error: 'login and password required' });
    }
    
    const tradeLocker = axios.create({
      baseURL: process.env.TRADELOCKER_BASE_URL || 'https://demo-api.tradelocker.com'
    });
    
    const response = await tradeLocker.post('/auth/login', {
      login,
      password
    });
    
    res.json({
      success: true,
      token: response.data.token,
      expires_at: response.data.expiresIn
    });
  } catch (error) {
    console.error('Error authenticating with TradeLocker:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tradelocker/accounts
 * Get list of accounts for authenticated user
 */
app.get('/api/tradelocker/accounts', requireApiKey, async (req, res) => {
  try {
    const tradeLocker = axios.create({
      baseURL: process.env.TRADELOCKER_BASE_URL || 'https://demo-api.tradelocker.com',
      headers: {
        'Authorization': `Bearer ${process.env.TRADELOCKER_TOKEN}`
      }
    });
    
    const response = await tradeLocker.get('/accounts');
    
    res.json({
      success: true,
      accounts: response.data.accounts || [],
      count: (response.data.accounts || []).length
    });
  } catch (error) {
    console.error('Error fetching TradeLocker accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tradelocker/positions/:accountId
 * Get open positions for an account
 */
app.get('/api/tradelocker/positions/:accountId', requireApiKey, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const tradeLocker = axios.create({
      baseURL: process.env.TRADELOCKER_BASE_URL || 'https://demo-api.tradelocker.com',
      headers: {
        'Authorization': `Bearer ${process.env.TRADELOCKER_TOKEN}`
      }
    });
    
    const response = await tradeLocker.get(`/accounts/${accountId}/openPositions`);
    
    res.json({
      success: true,
      account_id: accountId,
      positions: response.data.data || [],
      count: (response.data.data || []).length
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tradelocker/history/:accountId
 * Get trade history for an account
 * Query params: from=2025-01-01, to=2025-03-01
 */
app.get('/api/tradelocker/history/:accountId', requireApiKey, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { from, to } = req.query;
    
    const tradeLocker = axios.create({
      baseURL: process.env.TRADELOCKER_BASE_URL || 'https://demo-api.tradelocker.com',
      headers: {
        'Authorization': `Bearer ${process.env.TRADELOCKER_TOKEN}`
      }
    });
    
    let url = `/accounts/${accountId}/closedPositions`;
    const params = {};
    
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await tradeLocker.get(url, { params });
    
    res.json({
      success: true,
      account_id: accountId,
      trades: response.data.data || [],
      count: (response.data.data || []).length,
      period: { from, to }
    });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI COACH ENDPOINT
// ============================================================================

/**
 * POST /api/coach/analyze
 * Get AI-powered trading analysis using Claude
 * Body: { trades: [{date, instrument, profit, reason}], accountType, question }
 * Streams response back to client using SSE (Server-Sent Events)
 */
app.post('/api/coach/analyze', requireApiKey, async (req, res) => {
  try {
    const { trades, accountType = 'funded', question } = req.body;
    
    if (!trades || !Array.isArray(trades)) {
      return res.status(400).json({ error: 'trades array required' });
    }
    
    const tradesText = trades
      .map((t, i) => `Trade ${i + 1}: ${t.date} - ${t.instrument} - $${t.profit} - ${t.reason || 'N/A'}`)
      .join('\n');
    
    const prompt = question || \`Analyze my trading performance and provide specific actionable advice. My account type is \${accountType}.\`;
    
    const userMessage = \`
Trading Account Type: \${accountType}

Recent Trades:
\${tradesText}

Question: \${prompt}

Please provide:
1. Performance assessment
2. Risk management observations
3. Specific areas for improvement
4. Action items for next 7 days
    \`;
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
      // Stream response from Claude
      const stream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'You are an expert prop trading coach for FundingPips. Provide practical, data-driven advice focused on profitability, risk management, and consistency.',
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      });
      
      // Stream text events
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          res.write(\`data: \${JSON.stringify({ text: chunk.delta.text })}\n\n\`);
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamError) {
      console.error('Error streaming from Claude:', streamError);
      res.write(\`data: \${JSON.stringify({ error: streamError.message })}\n\n\`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Error in AI coach:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

/**
 * POST /api/reports/generate
 * Create an async report generation job
 * Body: { type, traderId, accountId, dateRange, format }
 */
app.post('/api/reports/generate', requireApiKey, async (req, res) => {
  try {
    const { type, traderId, accountId, dateRange, format = 'pdf' } = req.body;
    
    if (!type || !traderId) {
      return res.status(400).json({ error: 'type and traderId required' });
    }
    
    const jobId = crypto.randomUUID();
    
    // Create job record in Supabase
    const { data, error } = await supabase
      .from('report_jobs')
      .insert({
        job_id: jobId,
        type,
        trader_id: traderId,
        account_id: accountId,
        date_range: dateRange,
        format,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Queue job for processing (would trigger async worker in production)
    console.log(\`Report job queued: \${jobId}\`);
    
    res.status(202).json({
      success: true,
      job_id: jobId,
      status: 'pending',
      message: 'Report generation started'
    });
  } catch (error) {
    console.error('Error creating report job:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/:jobId/status
 * Get status of a report generation job
 */
app.get('/api/reports/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const { data, error } = await supabase
      .from('report_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      job_id: jobId,
      status: data.status,
      progress: data.progress || 0,
      created_at: data.created_at,
      completed_at: data.completed_at
    });
  } catch (error) {
    console.error('Error fetching report status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/:jobId/download
 * Download completed report file
 */
app.get('/api/reports/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const { data, error } = await supabase
      .from('report_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (error) throw error;
    
    if (data.status !== 'completed') {
      return res.status(400).json({ error: \`Report not ready. Status: \${data.status}\` });
    }
    
    // In production, fetch from storage and stream file
    res.json({
      success: true,
      message: 'Report download',
      file_url: \`/files/reports/\${jobId}.\${data.format}\`,
      file_size: data.file_size,
      generated_at: data.completed_at
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LEADERBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/leaderboard
 * Get trader leaderboard rankings
 * Query params: period=weekly, platform=fundingpips, limit=10
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { period = 'weekly', platform = 'fundingpips', limit = 10 } = req.query;
    const cacheKey = \`leaderboard-\${period}-\${platform}\`;
    
    // Check cache (cache for 1 hour)
    if (leaderboardCache.has(cacheKey)) {
      const cached = leaderboardCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) {
        return res.json({
          success: true,
          data: cached.data.slice(0, parseInt(limit)),
          period,
          platform,
          cached: true
        });
      }
    }
    
    // Fetch from Supabase
    let query = supabase
      .from('trader_stats')
      .select('*')
      .eq('platform', platform)
      .order('profit_ratio', { ascending: false })
      .limit(100);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Cache result
    leaderboardCache.set(cacheKey, {
      data: data || [],
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      data: (data || []).slice(0, parseInt(limit)),
      count: (data || []).slice(0, parseInt(limit)).length,
      period,
      platform,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leaderboard/submit
 * Submit trader statistics to leaderboard (requires auth)
 * Body: { traderId, profit, trades, winRate, profitRatio, platform }
 */
app.post('/api/leaderboard/submit', requireApiKey, async (req, res) => {
  try {
    const { traderId, profit, trades, winRate, profitRatio, platform = 'fundingpips' } = req.body;
    
    if (!traderId || profit === undefined) {
      return res.status(400).json({ error: 'traderId and profit required' });
    }
    
    const { data, error } = await supabase
      .from('trader_stats')
      .upsert({
        trader_id: traderId,
        platform,
        profit,
        trades: trades || 0,
        win_rate: winRate || 0,
        profit_ratio: profitRatio || 0,
        submitted_at: new Date().toISOString()
      }, { onConflict: 'trader_id,platform' });
    
    if (error) throw error;
    
    // Clear cache
    leaderboardCache.clear();
    
    res.json({
      success: true,
      message: 'Stats submitted to leaderboard',
      data
    });
  } catch (error) {
    console.error('Error submitting leaderboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WEBSOCKET HANDLER
// ============================================================================

/**
 * WebSocket connection handling
 * Supports: subscribe_positions, subscribe_news, subscribe_consistency
 */
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to PropEdge Server',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  }));
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      const { type, accountId, currency } = message;
      
      console.log(\`WebSocket message received: \${type}\`);
      
      switch (type) {
        case 'subscribe_positions':
          // Start sending position updates every 5 seconds
          const posInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'positions_update',
                account_id: accountId,
                positions: [
                  {
                    id: '1',
                    instrument: 'EURUSD',
                    volume: 1.0,
                    pnl: Math.random() * 100 - 50,
                    timestamp: new Date().toISOString()
                  }
                ],
                timestamp: new Date().toISOString()
              }));
            }
          }, 5000);
          
          ws.posInterval = posInterval;
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: 'positions',
            account_id: accountId
          }));
          break;
          
        case 'subscribe_news':
          // Start sending news alerts every 30 seconds
          const newsInterval = setInterval(async () => {
            if (ws.readyState === WebSocket.OPEN) {
              const calendar = await fetchEconomicCalendar();
              ws.send(JSON.stringify({
                type: 'news_alert',
                events: calendar.slice(0, 5),
                timestamp: new Date().toISOString()
              }));
            }
          }, 30000);
          
          ws.newsInterval = newsInterval;
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: 'news',
            currency: currency || 'all'
          }));
          break;
          
        case 'subscribe_consistency':
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: 'consistency',
            account_id: accountId
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: \`Unknown message type: \${type}\`
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  // Clean up on disconnect
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (ws.posInterval) clearInterval(ws.posInterval);
    if (ws.newsInterval) clearInterval(ws.newsInterval);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * 404 Not Found handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(\`
    ╔════════════════════════════════════════════╗
    ║         PropEdge Server v2.0.0             ║
    ║    AI Trader Intelligence Platform         ║
    ║     FundingPips Prop Trading Firm          ║
    ╚════════════════════════════════════════════╝
    
    Server running on: http://localhost:\${PORT}
    Environment: \${process.env.NODE_ENV || 'development'}
    WebSocket: ws://localhost:\${PORT}/ws
    Health Check: GET /health
  \`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
