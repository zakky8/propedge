# PropEdge v2 — AI Trader Intelligence Platform for FundingPips

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![License](https://img.shields.io/badge/license-UNLICENSED-red)
![Status](https://img.shields.io/badge/status-production-brightgreen)

PropEdge is an AI-powered trader intelligence platform built specifically for FundingPips proprietary traders. It provides real-time compliance monitoring, consistency rule enforcement, news trading alerts, and AI-powered trading coaching.

## Features

- **F3 Rule Acknowledgement**: Track trader acceptance of platform rules with IP logging and timestamps
- **F4 Cost Calculator**: Analyze trading costs and slippage impact on account performance
- **F5 Consistency Engine**: Advanced consistency ratio calculation with daily profit caps (15%-45%)
- **F6 News Monitor**: Real-time economic calendar tracking with 10-minute trading windows
- **AI Coach**: Anthropic Claude integration for personalized trading insights and analysis
- **Analytics Dashboard**: Real-time PnL tracking, win rate analysis, and performance metrics
- **Report Generation**: PDF/CSV export of monthly statements and compliance reports
- **Community Leaderboard**: Trader rankings by return, Sharpe ratio, and badge system

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (Supabase recommended)
- Anthropic API key
- TradeLocker account credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/propedge.git
cd propedge

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env

# Compile frontend and run migrations
npm run compile
npm run db:migrate
npm run db:seed

# Start the server
npm start
```

The server will be available at `http://localhost:3000`

### Demo

To run the standalone demo without backend setup:

```bash
# Open index.html in your browser
open index.html
```

## Architecture

### Frontend
- **React 18.3.1** with pre-compiled JSX
- **Babel Standalone** for in-browser compilation
- **WebSocket** client for real-time updates
- Responsive design for desktop and mobile

### Backend
- **Express.js** REST API with CORS support
- **Rate limiting** for API protection
- **Helmet** for security headers
- **Node.js 18+** runtime

### Database
- **Supabase** PostgreSQL 15
- **UUID** primary keys for distributed systems
- **Row-level security** policies
- **Audit logging** for compliance

### Real-time
- **WebSocket** connections for live trades
- **Redis/Upstash** for pub/sub messaging
- **Rate limiting** per connection

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/consistency` | Get consistency metrics for account |
| POST | `/api/trades/validate` | Validate trades against rules |
| GET | `/api/rules` | List active compliance rules |
| POST | `/api/rules/acknowledge` | Acknowledge a rule |
| GET | `/api/leaderboard` | Get trader rankings |
| POST | `/api/reports/generate` | Request report generation |
| GET | `/api/news` | Get economic calendar events |
| POST | `/api/chat` | AI coaching conversation |
| WS | `/ws` | WebSocket for real-time updates |

## FundingPips Consistency Rule

The consistency rule ensures that no single trading day's profit exceeds a configured percentage of total profit. This prevents "lucky day" trading and enforces disciplined risk management.

### Formula

```
maxDayProfit = cap × totalProfit
currentRatio = bestDayProfit / totalProfit
isViolating = currentRatio > cap
```

### Example

For a Consistency Zero account (15% cap):
- Total profit: $1,000
- Best day profit: $200
- Current ratio: 200/1000 = 20%
- Status: **VIOLATING** (20% > 15%)

### Account Types

- **Consistency Zero**: 15% cap (strictest)
- **Consistency On-Demand**: 35% cap
- **Consistency Pro**: 45% cap (most lenient)
- **2-Step Standard**: No cap, 5% daily loss limit
- **2-Step Pro**: No cap, 3% daily loss limit
- **1-Step**: No cap, 5% daily loss limit

## XAG Silver Warning

Position size tracking for Silver (XAG) futures trading:

- Warning threshold: $50 per lot
- Tracks cumulative position across multiple trades
- Real-time alert on position increase
- Integration with news calendar for high-volatility events

Configuration via API:

```bash
POST /api/positions/xag-warning
{
  "threshold": 50,
  "alert_on_increase": true,
  "notify_news_events": true
}
```

## Deployment

### Railway (Recommended)

1. **Create Railway project**: `railway init`
2. **Link Supabase**: Add SUPABASE_URL and keys to Railway variables
3. **Deploy**: `railway up` or use GitHub integration
4. **Monitor**: Dashboard at railway.app

### Environment Setup on Railway

```bash
PORT=3000
NODE_ENV=production
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
# ... see .env.example for complete list
```

### Build and Run

```bash
npm run build
npm start
```

The platform automatically scales on Railway with PostgreSQL connection pooling.

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| PORT | Server port | No | 3000 |
| NODE_ENV | Environment mode | No | development |
| SUPABASE_URL | Supabase project URL | Yes | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | Public API key | Yes | eyJ... |
| SUPABASE_SERVICE_KEY | Service role key | Yes | eyJ... |
| ANTHROPIC_API_KEY | Claude API key | Yes | sk-ant-... |
| TRADELOCKER_* | TradeLocker credentials | Yes | See .env.example |
| JBLANKED_URL | News calendar endpoint | No | https://nfs.faireconomy.media/... |
| RAPIDAPI_KEY | RapidAPI key for market data | No | - |
| UPSTASH_REDIS_URL | Redis connection string | No | redis://... |
| ENABLE_WEBSOCKET | Enable WebSocket server | No | true |
| ENABLE_AI_COACH | Enable AI coaching | No | true |
| RATE_LIMIT_MAX | Max requests per minute | No | 200 |

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.19.2 |
| Database | PostgreSQL | 15+ |
| ORM/Client | Supabase | 2.43.0 |
| AI | Anthropic Claude | ^0.27.0 |
| Frontend | React | 18.3.1 |
| Real-time | WebSocket | 8.18.0 |
| HTTP Client | Axios | 1.7.2 |
| Testing | Jest | 29.7.0 |
| Linting | ESLint | 9.5.0 |

## Testing

```bash
# Run all tests
npm test

# Run consistency engine tests
npm run test:consistency

# Run server tests
npm run test:server

# Run with coverage
npm test -- --coverage
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Run linter
npm lint

# Database migration
npm run db:migrate

# Seed test data
npm run db:seed
```

## License

UNLICENSED — Proprietary software for FundingPips traders only. Unauthorized copying, modification, or distribution is prohibited.

---

**Built with Claude AI** | [FundingPips](https://fundingpips.com) | v2.0.0
