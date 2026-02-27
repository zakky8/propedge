# PropEdge — AI Trader Intelligence Platform

**White-label prop trading software built for FundingPips traders.**

Combines real-time FundingPips rule enforcement, consistency tracking, cost analysis, and news protection — powered by Claude AI and the Anthropic Skills/Plugins ecosystem.

---

## What PropEdge Does

| Feature | Problem Solved | API Required |
|---------|---------------|-------------|
| **F3 — Rule Centre** | Retroactive rule changes (FundingTicks shutdown) | Supabase only |
| **F4 — Cost Calculator** | Hidden XAG $50/pip trap, spread shock | None (built-in) |
| **F5 — Consistency Engine** | 15%/35%/45% cap violations at payout | TradeLocker REST |
| **F6 — News Monitor** | News window violations, position risk | JBlanked (free) |
| **AI Coach** | No intelligent trading guidance exists | Anthropic SDK |
| **Analytics** | No Sharpe/Sortino/drawdown tracking | None (computed) |
| **Reports** | No exportable performance PDFs/Excel | Skills repos |
| **Community** | No trader leaderboard or achievement system | Supabase |

---

## Quick Start

### 1. Open the Dashboard (Frontend)
Just open `index.html` in any browser — no install needed.

```bash
open index.html
# or double-click index.html in Finder/Explorer
```

The dashboard runs 100% in the browser using React 18 + Tailwind CSS via CDN.

### 2. Run the Backend API

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run dev

# Server starts at http://localhost:3001
```

### 3. Set Up Database

Run `database.sql` in your Supabase SQL Editor:
- Go to https://app.supabase.com
- Open your project → SQL Editor → New Query
- Paste contents of `database.sql` and click Run

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (index.html)                        │
│  React 18 + Tailwind + Babel CDN            │
└──────────────┬──────────────────────────────┘
               │ HTTP + WebSocket
               ▼
┌─────────────────────────────────────────────┐
│  server.js  (Node.js + Express)             │
│  Railway — $5/month                         │
├─────────────────────────────────────────────┤
│  consistency-engine.js                      │
│  Pure JS formula — zero dependencies        │
└──────┬──────────┬──────────────┬────────────┘
       │          │              │
       ▼          ▼              ▼
 Supabase    TradeLocker    JBlanked API
 PostgreSQL  REST API       (Free)
 (free)      (public)
       │
       ▼
 Anthropic API
 (Claude claude-sonnet-4-6)
```

---

## File Structure

```
PropEdge/
├── index.html              ← Full React dashboard (open in browser)
├── server.js               ← Node.js/Express backend API
├── consistency-engine.js   ← Core FundingPips formula engine
├── package.json            ← Node dependencies
├── database.sql            ← Supabase schema + seed data
├── .env.example            ← Environment variable template
└── README.md               ← This file
```

---

## API Reference

### Health
```
GET /health → { status, version, timestamp }
```

### F3 — Rules
```
GET  /api/rules                    → Active rules list
GET  /api/rules/pending/:traderId  → Unacknowledged rules
POST /api/rules/acknowledge        → Record acknowledgement
POST /api/rules                    → Create rule (admin)
```

### F4 — Cost Calculator
```
POST /api/cost/calculate           → Spread + commission + % of daily limit
GET  /api/cost/instruments         → All instruments with pip values
```

### F5 — Consistency
```
POST /api/consistency/calculate    → Calculate from trade array
GET  /api/consistency/live/:id     → Live data from TradeLocker
```

### F6 — News
```
GET /api/news                      → Today's high-impact events
GET /api/news/risk-check           → Is current time in news window?
```

### AI Coach
```
POST /api/coach/analyze            → Full analysis (Claude claude-sonnet-4-6)
POST /api/coach/stream             → Streaming SSE response
```

### Analytics
```
POST /api/analytics/metrics        → Sharpe, Sortino, drawdown, win rate
```

---

## Consistency Rule Formula

The exact FundingPips formula implemented in `consistency-engine.js`:

```javascript
// Cap values per account type:
// Zero = 0.15 | On-Demand = 0.35 | Pro = 0.45

maxTodayAllowed = (cap × totalProfit) / (1 - cap) - Math.max(todayPnL, 0)

// Example: On-Demand, $3,900 total profit, today +$1,200
// cap = 0.35
// max = (0.35 × 3900) / (1 - 0.35) - 1200
// max = 1365 / 0.65 - 1200
// max = 2100 - 1200 = $900 additional allowed today
```

---

## Instrument Pip Values

| Symbol | Pip Value/lot | Warning |
|--------|--------------|---------|
| EURUSD | $10 | — |
| GBPUSD | $10 | — |
| XAUUSD | $10 | — |
| **XAGUSD** | **$50** | ⚠️ 5× higher than EURUSD — critical |
| BTCUSD | $1 | High spread ($15) |
| US30 | $1 | — |
| NAS100 | $1 | — |

---

## Deployment

### Railway (Recommended — $5/month)

1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables in Railway dashboard
4. Railway auto-deploys on every push

```bash
# railway CLI
railway login
railway init
railway up
```

### Environment Variables (Required)

| Variable | Where to Get |
|----------|-------------|
| `SUPABASE_URL` | supabase.com → Settings → API |
| `SUPABASE_SERVICE_KEY` | supabase.com → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `PROPEDGE_API_KEY` | Generate any random string |
| `RAPIDAPI_KEY` | rapidapi.com (backup news feed) |

---

## Anthropic Repos Integration

PropEdge uses all 3 Anthropic repos:

| Repo | Usage in PropEdge |
|------|-------------------|
| **anthropics/skills** | Reports: PDF performance summaries, Excel trade logs, PowerPoint pitch decks, Word drawdown reports |
| **anthropics/knowledge-work-plugins** | AI Coach (Customer Support plugin), Challenge tracker (Productivity), Leaderboard (Marketing) |
| **anthropics/financial-services-plugins** | Sharpe/Sortino calculation, risk metrics, spread analysis, financial modeling |

---

## Selling to FundingPips

### Contact Strategy
1. **LinkedIn**: Message CEO/Co-founder directly with demo video
2. **Email**: partnerships@fundingpips.com
3. **Discord**: FundingPips community server — reach moderators
4. **Twitter/X**: @FundingPips — DM or mention with demo

### Pricing Model
| Tier | Price | Value |
|------|-------|-------|
| Starter | $2,000/month | F3 + F4 only |
| Pro | $8,000/month | All 4 features + AI Coach |
| Enterprise | $15,000/month | Custom white-label + analytics |

Infrastructure cost: ~$10/month. Margin: **800x–1500x**.

---

## Infrastructure Cost

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway (server.js) | Starter | $5 |
| Supabase (PostgreSQL) | Free | $0 |
| Anthropic API (AI Coach) | Pay-per-use | ~$2–5 |
| JBlanked (news) | Free | $0 |
| **Total** | | **~$10/month** |

---

## License

Proprietary — All rights reserved. Not for redistribution.
