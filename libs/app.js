// PropEdge - AI Trader Intelligence Platform for FundingPips
// Premium React Dashboard - Self-contained JSX (React/ReactDOM are global)

// ============================================================================
// CONSTANTS
// ============================================================================

const INSTRUMENTS = [{
  id: 'eurusd',
  symbol: 'EURUSD',
  pipValue: 10,
  spread: 0.3,
  category: 'Major',
  warning: false
}, {
  id: 'gbpusd',
  symbol: 'GBPUSD',
  pipValue: 10,
  spread: 0.3,
  category: 'Major',
  warning: false
}, {
  id: 'usdjpy',
  symbol: 'USDJPY',
  pipValue: 9.3,
  spread: 0.3,
  category: 'Major',
  warning: false
}, {
  id: 'audusd',
  symbol: 'AUDUSD',
  pipValue: 10,
  spread: 0.5,
  category: 'Major',
  warning: false
}, {
  id: 'nzdusd',
  symbol: 'NZDUSD',
  pipValue: 10,
  spread: 0.5,
  category: 'Major',
  warning: false
}, {
  id: 'xauusd',
  symbol: 'XAUUSD',
  pipValue: 1,
  spread: 0.3,
  category: 'Commodities',
  warning: false
}, {
  id: 'xagusd',
  symbol: 'XAGUSD',
  pipValue: 100,
  spread: 2,
  category: 'Commodities',
  warning: true
}, {
  id: 'oil',
  symbol: 'CRUDEOIL',
  pipValue: 10,
  spread: 0.05,
  category: 'Commodities',
  warning: false
}, {
  id: 'sp500',
  symbol: 'SP500',
  pipValue: 1,
  spread: 2,
  category: 'Indices',
  warning: false
}, {
  id: 'btcusd',
  symbol: 'BTCUSD',
  pipValue: 0.1,
  spread: 50,
  category: 'Crypto',
  warning: false
}, {
  id: 'ethusd',
  symbol: 'ETHUSD',
  pipValue: 0.01,
  spread: 5,
  category: 'Crypto',
  warning: false
}];
const ACCOUNT_TYPES = [{
  id: '2-step-standard',
  name: '2-Step Standard',
  steps: 2,
  dailyLimit: 5,
  maxDD: 5,
  consistencyCap: 0.1
}, {
  id: '2-step-pro',
  name: '2-Step Pro',
  steps: 2,
  dailyLimit: 10,
  maxDD: 8,
  consistencyCap: 0.15
}, {
  id: '1-step',
  name: '1-Step Funded',
  steps: 1,
  dailyLimit: 10,
  maxDD: 10,
  consistencyCap: 0.2
}, {
  id: 'zero',
  name: 'Zero',
  steps: 0,
  dailyLimit: 0,
  maxDD: 0,
  consistencyCap: 0.25
}];
const PAYOUT_TYPES = [{
  id: 'on-demand',
  name: 'On-Demand',
  schedule: 'Instant',
  minPayout: 500
}, {
  id: 'bi-weekly',
  name: 'Bi-Weekly',
  schedule: 'Every 2 weeks',
  minPayout: 1000
}, {
  id: 'weekly',
  name: 'Weekly',
  schedule: 'Every 7 days',
  minPayout: 750
}, {
  id: '2-step-pro',
  name: '2-Step Pro Payout',
  schedule: 'After step 2',
  minPayout: 2000
}];

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TRADES = (() => {
  const trades = [];
  for (let day = 1; day <= 28; day++) {
    const date = new Date(2026, 1, day);
    const numTrades = Math.floor(Math.random() * 8) + 3;
    const dayProfit = (Math.random() - 0.3) * 500 + 200;
    trades.push({
      date: date.toISOString().split('T')[0],
      trades: numTrades,
      profit: dayProfit
    });
  }
  return trades;
})();
const NEWS_EVENTS = [{
  id: 1,
  time: -1.5,
  currency: 'USD',
  impact: 'HIGH',
  event: 'FOMC Interest Rate Decision',
  forecast: '5.25%',
  previous: '5.50%',
  window: 1
}, {
  id: 2,
  time: 0.75,
  currency: 'EUR',
  impact: 'HIGH',
  event: 'ECB Interest Rate Decision',
  forecast: '4.50%',
  previous: '4.50%',
  window: 1
}, {
  id: 3,
  time: 2.25,
  currency: 'GBP',
  impact: 'MEDIUM',
  event: 'UK CPI YoY',
  forecast: '4.2%',
  previous: '4.2%',
  window: 1
}, {
  id: 4,
  time: 3.5,
  currency: 'JPY',
  impact: 'MEDIUM',
  event: 'BOJ Policy Decision',
  forecast: '-0.10%',
  previous: '0.00%',
  window: 2
}, {
  id: 5,
  time: 4.75,
  currency: 'AUD',
  impact: 'LOW',
  event: 'RBA Minutes Release',
  forecast: 'N/A',
  previous: 'N/A',
  window: 1
}, {
  id: 6,
  time: 6.0,
  currency: 'CHF',
  impact: 'MEDIUM',
  event: 'SNB Interest Rate',
  forecast: '1.00%',
  previous: '1.00%',
  window: 1
}];
const MOCK_RULES = [{
  id: 1,
  title: 'Daily Loss Limit Update',
  category: 'Risk Management',
  effectiveDate: '2026-02-28',
  oldText: 'Daily loss limit is 5% of account balance for all account types.',
  newText: 'Daily loss limit is now 5% for Standard, 10% for Pro accounts. Zero accounts: 0%.',
  affectedAccounts: ['2-step-standard', '2-step-pro', 'zero'],
  acknowledged: false
}, {
  id: 2,
  title: 'New Instrument: Micro Gold Contracts',
  category: 'Trading Rules',
  effectiveDate: '2026-02-28',
  oldText: 'Gold trading available via XAUUSD contracts only.',
  newText: 'Micro gold contracts (1/100th standard) now available. Spread: 0.5 pips.',
  affectedAccounts: ['2-step-standard', '2-step-pro', '1-step'],
  acknowledged: false
}, {
  id: 3,
  title: 'Consistency Ratio Enforcement',
  category: 'Compliance',
  effectiveDate: '2026-03-01',
  oldText: 'Consistency ratio monitored monthly only.',
  newText: 'Consistency ratio now enforced daily. Violating traders flagged immediately.',
  affectedAccounts: ['2-step-standard', '2-step-pro', '1-step', 'zero'],
  acknowledged: false
}];
const MOCK_POSITIONS = [{
  id: 1,
  symbol: 'EURUSD',
  type: 'LONG',
  entry: 1.0850,
  current: 1.0872,
  size: 2.5,
  pnl: 550,
  pnlPct: 2.15
}, {
  id: 2,
  symbol: 'GBPUSD',
  type: 'SHORT',
  entry: 1.2640,
  current: 1.2610,
  size: 1.0,
  pnl: 300,
  pnlPct: 2.38
}, {
  id: 3,
  symbol: 'XAUUSD',
  type: 'LONG',
  entry: 2045.50,
  current: 2068.75,
  size: 0.5,
  pnl: 1161.25,
  pnlPct: 1.14
}];
const MOCK_LEADERBOARD = [{
  rank: 1,
  name: 'TraderPro_TX',
  country: 'US',
  profit: 12450,
  winRate: 68.5
}, {
  rank: 2,
  name: 'ForexMaster',
  country: 'UK',
  profit: 11280,
  winRate: 65.2
}, {
  rank: 3,
  name: 'AlgoKing',
  country: 'SG',
  profit: 10950,
  winRate: 72.1
}, {
  rank: 4,
  name: 'VolumeHunter',
  country: 'AU',
  profit: 9840,
  winRate: 63.8
}, {
  rank: 5,
  name: 'DataDrivenDan',
  country: 'CA',
  profit: 9210,
  winRate: 71.3
}, {
  rank: 6,
  name: 'SwingSetSally',
  country: 'US',
  profit: 8765,
  winRate: 59.2
}, {
  rank: 7,
  name: 'TrendFollower',
  country: 'DE',
  profit: 8420,
  winRate: 67.4
}, {
  rank: 8,
  name: 'ScalpMaster',
  country: 'JP',
  profit: 7890,
  winRate: 72.8
}, {
  rank: 9,
  name: 'MyTradingCode',
  country: 'NL',
  profit: 7245,
  winRate: 61.1
}, {
  rank: 10,
  name: 'YourAccount',
  country: 'US',
  profit: 6850,
  winRate: 58.9
}];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}
function formatPct(value) {
  return (value >= 0 ? '+' : '') + (value * 100).toFixed(2) + '%';
}
function formatSeconds(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function calculateConsistency(totalProfit, todayPnL, cap) {
  if (totalProfit <= 0) return 0;
  const maxToday = cap * totalProfit / (1 - cap) - Math.max(todayPnL, 0);
  return Math.min(1, Math.abs(todayPnL) / (maxToday || 0.01));
}
function calculateTrueCost(lotSize, spread, pipValue) {
  return lotSize * spread * pipValue;
}

// ============================================================================
// SVG COMPONENTS
// ============================================================================

function EquityChart({
  data
}) {
  if (!data || data.length === 0) {
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 600 120",
      style: {
        width: '100%',
        height: 'auto'
      }
    }, /*#__PURE__*/React.createElement("rect", {
      width: "600",
      height: "120",
      fill: "var(--bg2)"
    }), /*#__PURE__*/React.createElement("text", {
      x: "300",
      y: "60",
      textAnchor: "middle",
      fill: "var(--t3)",
      fontSize: "14"
    }, "No data"));
  }
  const points = data.map((d, i) => ({
    x: i / (data.length - 1 || 1) * 600,
    y: 120 - (d.equity || 25000) / 25000 * 100,
    value: d.equity || 25000
  }));
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fillPoints = `0,120 ${polylinePoints} 600,120`;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 600 120",
    style: {
      width: '100%',
      height: 'auto'
    },
    className: "gbl"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "eqGrad",
    x1: "0%",
    y1: "0%",
    x2: "0%",
    y2: "100%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#10b981",
    stopOpacity: "0.3"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#10b981",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("polygon", {
    points: fillPoints,
    fill: "url(#eqGrad)"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: polylinePoints,
    fill: "none",
    stroke: "#10b981",
    strokeWidth: "2"
  }), points.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: p.x,
    cy: p.y,
    r: "1.5",
    fill: "#10b981"
  })), /*#__PURE__*/React.createElement("text", {
    x: "10",
    y: "110",
    fontSize: "11",
    fill: "var(--t3)",
    className: "lb"
  }, "Feb 1"), /*#__PURE__*/React.createElement("text", {
    x: "570",
    y: "110",
    fontSize: "11",
    fill: "var(--t3)",
    className: "lb",
    textAnchor: "end"
  }, "Feb 28"));
}
function ArcGauge({
  pct,
  color = '#3b82f6',
  label = 'Ratio'
}) {
  const startAngle = -140;
  const endAngle = 140;
  const angle = startAngle + (endAngle - startAngle) * pct;
  const rad = angle * Math.PI / 180;
  const x = 60 + 40 * Math.cos(rad);
  const y = 60 + 40 * Math.sin(rad);
  const startRad = startAngle * Math.PI / 180;
  const sx = 60 + 40 * Math.cos(startRad);
  const sy = 60 + 40 * Math.sin(startRad);
  const endRad = endAngle * Math.PI / 180;
  const ex = 60 + 40 * Math.cos(endRad);
  const ey = 60 + 40 * Math.sin(endRad);
  const bgArc = `M ${sx} ${sy} A 40 40 0 0 1 ${ex} ${ey}`;
  const fillArc = angle > startAngle ? `M ${sx} ${sy} A 40 40 0 0 1 ${x} ${y}` : '';
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 120",
    style: {
      width: '120px',
      height: '120px'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: bgArc,
    stroke: "var(--card-h)",
    strokeWidth: "8",
    fill: "none",
    strokeLinecap: "round"
  }), fillArc && /*#__PURE__*/React.createElement("path", {
    d: fillArc,
    stroke: color,
    strokeWidth: "8",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("text", {
    x: "60",
    y: "55",
    textAnchor: "middle",
    fontSize: "20",
    fontWeight: "600",
    fill: "var(--t1)"
  }, (pct * 100).toFixed(0), "%"), /*#__PURE__*/React.createElement("text", {
    x: "60",
    y: "72",
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--t3)",
    className: "lb"
  }, label));
}
function MiniBar({
  value,
  max,
  color = '#3b82f6'
}) {
  const pct = max > 0 ? value / max : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: '6px',
      background: 'var(--card-h)',
      borderRadius: '3px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${Math.min(100, pct * 100)}%`,
      background: color,
      transition: 'all 0.3s'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      minWidth: '40px',
      textAlign: 'right'
    }
  }, (pct * 100).toFixed(0), "%"));
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

function Sidebar({
  activeTab,
  setActiveTab
}) {
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'M3 3h8v8H3V3m10 0h8v8h-8V3M3 13h8v8H3v-8m10 0h8v8h-8v-8'
  }, {
    id: 'news',
    label: 'News Monitor',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.96-3.83c-.375-.48-.995-.67-1.56-.5-.564.17-1.04.72-1.04 1.35v4.15h12v-4.15c0-.63-.475-1.18-1.04-1.35-.562-.17-1.18.025-1.56.5z'
  }, {
    id: 'consistency',
    label: 'Consistency',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z'
  }, {
    id: 'costcalc',
    label: 'Cost Calc',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z'
  }, {
    id: 'rules',
    label: 'Rule Centre',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9.5c0 .83-.67 1.5-1.5 1.5S11 13.33 11 12.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM5 9h14v2H5V9z'
  }, {
    id: 'coach',
    label: 'AI Coach',
    icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v-2h8v2zm0-3h-8V9h8v2zm0-3H4V6h14v2z'
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z'
  }, {
    id: 'reports',
    label: 'Reports',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z'
  }, {
    id: 'community',
    label: 'Community',
    icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '240px',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--brd)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px',
      borderBottom: '1px solid var(--brd)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '36px',
      height: '36px',
      background: 'linear-gradient(135deg, var(--acc), #2dd4bf)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '16px'
    }
  }, "PE"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      fontWeight: '700',
      color: 'var(--t1)'
    }
  }, "PropEdge"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, "FundingPips")))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      margin: '16px',
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '8px'
    }
  }, "Account Status"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)',
      marginBottom: '8px'
    }
  }, "$25,000 \xB7 2-Step Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginBottom: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg"
  }, "FUNDED")), /*#__PURE__*/React.createElement("div", {
    className: "ptrack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pfill",
    style: {
      width: '62%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t3)',
      marginTop: '6px'
    }
  }, "$15,500 / $25,000")), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: '8px'
    }
  }, navItems.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: `nav-b${activeTab === item.id ? ' on' : ''}`,
    onClick: () => setActiveTab(item.id),
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 12px',
      margin: '4px 0',
      borderRadius: '8px',
      transition: 'all 0.2s',
      borderLeft: '3px solid transparent'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: item.icon
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px'
    }
  }, item.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px',
      borderTop: '1px solid var(--brd)',
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, "PropEdge v2.1.0", /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px'
    }
  }, "\xA9 FundingPips 2026")));
}

// ============================================================================
// TOP BAR COMPONENT
// ============================================================================

function TopBar() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      left: '240px',
      right: 0,
      height: '64px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--brd)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: '24px',
      paddingRight: '24px',
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--t1)'
    }
  }, "PropEdge Dashboard")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      color: 'var(--t2)',
      fontFamily: 'monospace',
      fontWeight: '600'
    }
  }, time.toLocaleTimeString()), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    style: {
      position: 'relative',
      width: '40px',
      height: '40px',
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.73 21a2 2 0 0 1-3.46 0"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '8px',
      height: '8px',
      background: 'var(--red)',
      borderRadius: '50%'
    }
  }))));
}

// ============================================================================
// DASHBOARD TAB
// ============================================================================

function Dashboard() {
  const totalProfit = MOCK_TRADES.reduce((sum, d) => sum + d.profit, 0);
  const todayProfit = MOCK_TRADES[MOCK_TRADES.length - 1]?.profit || 0;
  const accountType = ACCOUNT_TYPES.find(a => a.id === '2-step-pro');
  const consistencyRatio = calculateConsistency(totalProfit, todayProfit, accountType.consistencyCap);
  const maxToday = accountType.consistencyCap * totalProfit / (1 - accountType.consistencyCap) - Math.max(todayProfit, 0);
  const equityData = MOCK_TRADES.map((d, i) => ({
    date: d.date,
    equity: 25000 + MOCK_TRADES.slice(0, i + 1).reduce((sum, t) => sum + t.profit, 0)
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Cycle Profit"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--grn)',
      marginBottom: '4px'
    }
  }, formatCurrency(totalProfit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "Feb 1-28 2026")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Consistency Score"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--acc)',
      marginBottom: '4px'
    }
  }, (consistencyRatio * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "vs ", (accountType.consistencyCap * 100).toFixed(0), "% cap")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Max Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--amb)',
      marginBottom: '4px'
    }
  }, formatCurrency(Math.max(0, maxToday))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "Remaining cushion")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Next News"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--acc)',
      marginBottom: '4px'
    }
  }, "1h 30m"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "FOMC Decision"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginBottom: '24px',
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Equity Curve"), /*#__PURE__*/React.createElement(EquityChart, {
    data: equityData
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Feature Status"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      background: 'var(--bg2)',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--t1)'
    }
  }, "Trading Active"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg"
  }, "ACTIVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      background: 'var(--bg2)',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--t1)'
    }
  }, "Payout Available"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg"
  }, "YES")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      background: 'var(--bg2)',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '13px',
      color: 'var(--t1)'
    }
  }, "Rules Acknowledged"), /*#__PURE__*/React.createElement("span", {
    className: "badge br"
  }, "2/3")))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Open Positions (", MOCK_POSITIONS.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, MOCK_POSITIONS.map(pos => /*#__PURE__*/React.createElement("div", {
    key: pos.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px',
      background: 'var(--bg2)',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, pos.symbol, " ", pos.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, pos.size, " lots")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: pos.pnl >= 0 ? 'var(--grn)' : 'var(--red)'
    }
  }, formatCurrency(pos.pnl)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, formatPct(pos.pnlPct / 100)))))))));
}

// ============================================================================
// NEWS MONITOR TAB
// ============================================================================

function NewsMonitor() {
  const [time, setTime] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const nextEvent = NEWS_EVENTS[0];
  const eventSeconds = Math.max(0, nextEvent.time * 3600 - time);
  let statusClass = 'ag';
  let statusText = 'SAFE';
  if (eventSeconds < 600) statusClass = 'ab', statusText = 'WARNING';
  if (eventSeconds < 120) statusClass = 'ar', statusText = 'ACTIVE';
  if (eventSeconds < 30) statusClass = 'ar', statusText = 'RESTRICTED';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '40px',
      textAlign: 'center',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, var(--card), var(--card-h))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      color: 'var(--t2)',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }
  }, nextEvent.event), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '56px',
      fontWeight: '700',
      fontFamily: 'monospace',
      color: 'var(--acc)',
      marginBottom: '16px',
      letterSpacing: '2px'
    }
  }, formatSeconds(eventSeconds)), /*#__PURE__*/React.createElement("div", {
    className: `alrt a${statusClass}`,
    style: {
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '6px'
    }
  }, statusText)), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Forex Factory Events - Today"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: '1px solid var(--brd)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Time"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Currency"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Impact"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Event"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Forecast"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Previous"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Countdown"))), /*#__PURE__*/React.createElement("tbody", null, NEWS_EVENTS.map(evt => {
    const secondsLeft = Math.max(0, evt.time * 3600 - time);
    const hoursLeft = Math.floor(secondsLeft / 3600);
    const minutesLeft = Math.floor(secondsLeft % 3600 / 60);
    return /*#__PURE__*/React.createElement("tr", {
      key: evt.id,
      style: {
        borderBottom: '1px solid var(--brd)',
        background: secondsLeft < 600 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t1)'
      }
    }, evt.time > 0 ? '+' : '', evt.time, "h"), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t1)'
      }
    }, evt.currency), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `badge ${evt.impact === 'HIGH' ? 'br' : evt.impact === 'MEDIUM' ? 'ba' : 'bn'}`
    }, evt.impact)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t1)',
        maxWidth: '200px'
      }
    }, evt.event), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t2)'
      }
    }, evt.forecast), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t2)'
      }
    }, evt.previous), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '12px 8px',
        color: 'var(--t1)',
        fontWeight: '600',
        fontFamily: 'monospace'
      }
    }, `${hoursLeft}h ${minutesLeft}m`));
  })))));
}

// ============================================================================
// CONSISTENCY CALCULATOR TAB
// ============================================================================

function ConsistencyCalculator() {
  const [accountId, setAccountId] = React.useState('2-step-pro');
  const [payoutId, setPayoutId] = React.useState('on-demand');
  const account = ACCOUNT_TYPES.find(a => a.id === accountId);
  const totalProfit = MOCK_TRADES.reduce((sum, d) => sum + d.profit, 0);
  const dailyProfits = MOCK_TRADES.map(d => d.profit);
  let maxToday = account.consistencyCap * totalProfit / (1 - account.consistencyCap);
  let currentRatio = Math.min(Math.abs(dailyProfits[dailyProfits.length - 1]) / maxToday, 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      marginBottom: '24px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Account Type"), /*#__PURE__*/React.createElement("select", {
    value: accountId,
    onChange: e => setAccountId(e.target.value),
    className: "sel",
    style: {
      width: '100%'
    }
  }, ACCOUNT_TYPES.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Payout Schedule"), /*#__PURE__*/React.createElement("select", {
    value: payoutId,
    onChange: e => setPayoutId(e.target.value),
    className: "sel",
    style: {
      width: '100%'
    }
  }, PAYOUT_TYPES.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(ArcGauge, {
    pct: currentRatio,
    color: currentRatio > 0.8 ? 'var(--red)' : currentRatio > 0.5 ? 'var(--amb)' : 'var(--grn)',
    label: `${(account.consistencyCap * 100).toFixed(0)}% Cap`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      color: 'var(--t2)',
      marginBottom: '4px'
    }
  }, "Current Ratio"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--t1)'
    }
  }, (currentRatio * 100).toFixed(1), "%"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Key Metrics"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '4px'
    }
  }, "Total Cycle Profit"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, formatCurrency(totalProfit))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '4px'
    }
  }, "Max Daily Profit Allowed"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--acc)'
    }
  }, formatCurrency(maxToday))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '4px'
    }
  }, "Consistency Cap"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--amb)'
    }
  }, (account.consistencyCap * 100).toFixed(0), "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '4px'
    }
  }, "Daily Loss Limit"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--red)'
    }
  }, account.dailyLimit ? `-${(account.dailyLimit * 100).toFixed(0)}%` : 'N/A'))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Daily Breakdown"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px'
    }
  }, dailyProfits.slice(-14).map((profit, i) => {
    const dayNum = MOCK_TRADES.length - 14 + i;
    const dayDate = MOCK_TRADES[dayNum].date;
    const pctOfTotal = totalProfit > 0 ? Math.abs(profit) / totalProfit : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: dayNum,
      style: {
        padding: '12px',
        background: 'var(--bg2)',
        borderRadius: '6px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        color: 'var(--t3)',
        marginBottom: '6px'
      }
    }, dayDate.split('-').slice(1).join('/')), /*#__PURE__*/React.createElement(MiniBar, {
      value: pctOfTotal,
      max: 0.15,
      color: profit >= 0 ? 'var(--grn)' : 'var(--red)'
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '11px',
        color: profit >= 0 ? 'var(--grn)' : 'var(--red)',
        fontWeight: '600',
        marginTop: '6px'
      }
    }, formatCurrency(profit)));
  }))));
}

// ============================================================================
// COST CALCULATOR TAB
// ============================================================================

function CostCalculator() {
  const [instrumentId, setInstrumentId] = React.useState('eurusd');
  const [accountId, setAccountId] = React.useState('2-step-pro');
  const [lotSize, setLotSize] = React.useState(1);
  const [accountSize, setAccountSize] = React.useState(25000);
  const instrument = INSTRUMENTS.find(i => i.id === instrumentId);
  const account = ACCOUNT_TYPES.find(a => a.id === accountId);
  const spreadCost = calculateTrueCost(lotSize, instrument.spread, instrument.pipValue);
  const commissionCost = lotSize * 2.5;
  const totalEntryCost = spreadCost + commissionCost;
  const pctDailyLimit = totalEntryCost / (accountSize * (account.dailyLimit / 100)) * 100;
  const breakEvenPips = instrument.spread + commissionCost / (lotSize * instrument.pipValue);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      marginBottom: '24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Instrument"), /*#__PURE__*/React.createElement("select", {
    value: instrumentId,
    onChange: e => setInstrumentId(e.target.value),
    className: "sel",
    style: {
      width: '100%'
    }
  }, INSTRUMENTS.map(i => /*#__PURE__*/React.createElement("option", {
    key: i.id,
    value: i.id
  }, i.symbol)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Account Type"), /*#__PURE__*/React.createElement("select", {
    value: accountId,
    onChange: e => setAccountId(e.target.value),
    className: "sel",
    style: {
      width: '100%'
    }
  }, ACCOUNT_TYPES.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Lot Size (", lotSize, ")"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.01",
    max: "10",
    step: "0.01",
    value: lotSize,
    onChange: e => setLotSize(parseFloat(e.target.value)),
    className: "inp",
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Account Size"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: accountSize,
    onChange: e => setAccountSize(parseFloat(e.target.value)),
    className: "inp",
    style: {
      width: '100%'
    }
  }))), instrument.warning && /*#__PURE__*/React.createElement("div", {
    className: "alrt aa",
    style: {
      marginBottom: '24px',
      padding: '12px'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Silver (XAGUSD) Warning:"), " High spread and volatility. Minimum recommended lot size: 0.1. Ensure capital allocation is appropriate."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Spread Cost"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--acc)',
      marginBottom: '4px'
    }
  }, formatCurrency(spreadCost)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, instrument.spread, "pips \xD7 ", lotSize, "lots")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Commission"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--acc)',
      marginBottom: '4px'
    }
  }, formatCurrency(commissionCost)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "$2.50 per lot")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Total Entry Cost"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--red)',
      marginBottom: '4px'
    }
  }, formatCurrency(totalEntryCost)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "Spread + Commission")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "% of Daily Limit"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '24px',
      fontWeight: '700',
      color: pctDailyLimit > 80 ? 'var(--red)' : 'var(--grn)',
      marginBottom: '4px'
    }
  }, pctDailyLimit.toFixed(1), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "vs ", account.dailyLimit, "% limit")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Break-Even Pips"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'var(--amb)',
      marginBottom: '4px'
    }
  }, breakEvenPips.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "Pips to recover costs"))));
}

// ============================================================================
// RULE ACKNOWLEDGEMENT TAB
// ============================================================================

function RuleAcknowledgement() {
  const [rules, setRules] = React.useState(MOCK_RULES);
  const [modalOpen, setModalOpen] = React.useState(null);
  const [auditLog, setAuditLog] = React.useState([]);
  const handleAcknowledge = ruleId => {
    setRules(rules.map(r => r.id === ruleId ? {
      ...r,
      acknowledged: true
    } : r));
    setAuditLog([...auditLog, {
      timestamp: new Date().toISOString(),
      ruleId,
      action: 'ACKNOWLEDGED'
    }]);
    setModalOpen(null);
  };
  const pending = rules.filter(r => !r.acknowledged).length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Pending"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--amb)'
    }
  }, pending)), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Acknowledged"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, rules.length - pending)), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '8px'
    }
  }, "Total"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--acc)'
    }
  }, rules.length))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '24px'
    }
  }, rules.map(rule => /*#__PURE__*/React.createElement("div", {
    key: rule.id,
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 4px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, rule.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bn"
  }, rule.category), /*#__PURE__*/React.createElement("span", null, rule.effectiveDate))), rule.acknowledged && /*#__PURE__*/React.createElement("span", {
    className: "badge bg"
  }, "ACKNOWLEDGED")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '16px',
      padding: '12px',
      background: 'var(--bg2)',
      borderRadius: '6px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t2)',
      fontWeight: '600',
      marginBottom: '6px'
    }
  }, "PREVIOUS RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)',
      lineHeight: '1.5'
    }
  }, rule.oldText)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t2)',
      fontWeight: '600',
      marginBottom: '6px'
    }
  }, "NEW RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t1)',
      lineHeight: '1.5'
    }
  }, rule.newText))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    }
  }, rule.affectedAccounts.map(acc => /*#__PURE__*/React.createElement("span", {
    key: acc,
    className: "badge bb",
    style: {
      fontSize: '10px'
    }
  }, acc))), !rule.acknowledged && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-acc",
    onClick: () => setModalOpen(rule.id)
  }, "Review & Acknowledge")))), modalOpen && /*#__PURE__*/React.createElement("div", {
    className: "mo",
    onClick: () => setModalOpen(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb",
    style: {
      maxWidth: '500px'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--t1)'
    }
  }, "Rule Acknowledgement"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg2)',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '16px',
      maxHeight: '300px',
      overflow: 'auto',
      lineHeight: '1.6',
      color: 'var(--t2)',
      fontSize: '13px'
    }
  }, /*#__PURE__*/React.createElement("p", null, "By acknowledging this rule, you confirm that you have read, understood, and agree to comply with the updated trading rules and regulations set forth by FundingPips. Violation may result in account restrictions or closure."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '12px'
    }
  }, "Please ensure you have reviewed both the previous and new rule versions above before proceeding.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setModalOpen(null),
    style: {
      flex: 1
    }
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-acc",
    onClick: () => handleAcknowledge(modalOpen),
    style: {
      flex: 1
    }
  }, "I Understand & Agree")))), auditLog.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Acknowledgement Audit Log"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '12px'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: '1px solid var(--brd)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600'
    }
  }, "Timestamp"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600'
    }
  }, "Rule ID"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600'
    }
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", null, auditLog.map((log, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      borderBottom: '1px solid var(--brd)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      color: 'var(--t1)'
    }
  }, new Date(log.timestamp).toLocaleString()), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      color: 'var(--t1)'
    }
  }, "Rule #", log.ruleId), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg"
  }, log.action))))))));
}

// ============================================================================
// AI COACH TAB
// ============================================================================

function AICoach() {
  const [messages, setMessages] = React.useState([{
    id: 1,
    sender: 'ai',
    text: 'Welcome to AI Coach! I analyze your trading and provide personalized insights. How can I help today?',
    typed: true
  }, {
    id: 2,
    sender: 'ai',
    text: 'Pro Tip: Your consistency ratio is at 45.2% - well within limits. Consider increasing risk on high-confidence setups.',
    typed: true
  }, {
    id: 3,
    sender: 'ai',
    text: 'Market Alert: FOMC decision in 1.5 hours. Expect increased volatility. Manage position sizes accordingly.',
    typed: true
  }]);
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(null);
  const prompts = ['Explain my consistency ratio', 'How to optimize position sizing?', 'Best times for news trading?', 'Review my recent trades'];
  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: input,
      typed: true
    };
    setMessages([...messages, userMsg]);
    setInput('');
    setTyping(messages.length + 2);
    setTimeout(() => {
      const responses = ["Your consistency ratio measures daily profit stability. At 45.2%, you're trading within safe limits for your account tier.", 'Position sizing should scale with your account equity. For 2-Step Pro, risk max 10% daily profit per trade.', 'High-impact news usually comes at 13:00-15:00 UTC. Manage your positions ahead of events.', 'Your recent trades show strong entry timing but exit discipline needs work. Focus on R:R ratios.'];
      const response = responses[Math.floor(Math.random() * responses.length)];
      let displayedText = '';
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < response.length) {
          displayedText += response[charIndex];
          setMessages(prev => [...prev.slice(0, -1), {
            id: messages.length + 2,
            sender: 'ai',
            text: displayedText,
            typed: false
          }]);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setMessages(prev => [...prev.map(m => m.id === messages.length + 2 ? {
            ...m,
            typed: true
          } : m)]);
          setTyping(null);
        }
      }, 30);
    }, 800);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      flex: 1,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }
  }, messages.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--t3)'
    }
  }, "No messages yet. Start a conversation!") : messages.map(msg => /*#__PURE__*/React.createElement("div", {
    key: msg.id,
    style: {
      marginBottom: '16px',
      display: 'flex',
      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
      animation: 'fadeIn 0.3s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '60%',
      padding: '12px 16px',
      borderRadius: '8px',
      background: msg.sender === 'user' ? 'var(--acc)' : 'var(--card-h)',
      color: msg.sender === 'user' ? 'white' : 'var(--t1)',
      fontSize: '13px',
      lineHeight: '1.5'
    }
  }, msg.text, msg.sender === 'ai' && !msg.typed && /*#__PURE__*/React.createElement("span", {
    className: "tc"
  }, "\u258A"))))), messages.length <= 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, "Suggested Questions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }
  }, prompts.map((prompt, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "btn btn-ghost",
    onClick: () => {
      setInput(prompt);
      setTimeout(() => handleSendMessage(), 100);
    },
    style: {
      fontSize: '12px',
      padding: '8px 12px'
    }
  }, prompt))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px',
      display: 'flex',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Ask me anything about trading...",
    value: input,
    onChange: e => setInput(e.target.value),
    onKeyPress: e => e.key === 'Enter' && handleSendMessage(),
    className: "inp",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-acc",
    onClick: handleSendMessage,
    style: {
      width: '40px',
      height: '40px',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M22 2L11 13m11-11l-7 20-4-9-9-4 20-7z"
  })))));
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================

function Analytics() {
  const totalProfit = MOCK_TRADES.reduce((sum, d) => sum + d.profit, 0);
  const equityData = MOCK_TRADES.map((d, i) => ({
    date: d.date,
    equity: 25000 + MOCK_TRADES.slice(0, i + 1).reduce((sum, t) => sum + t.profit, 0)
  }));
  const dailyReturns = MOCK_TRADES.map(d => d.profit / 25000);
  const avgReturn = dailyReturns.reduce((a, b) => a + b) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2)) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpe = avgReturn * 252 / (stdDev * Math.sqrt(252));
  const sortino = avgReturn * 252 / Math.sqrt(252 * dailyReturns.filter(r => r < 0).reduce((sum, r) => sum + Math.pow(r, 2)) / dailyReturns.length);
  const winningDays = MOCK_TRADES.filter(d => d.profit > 0).length;
  const winRate = winningDays / MOCK_TRADES.length * 100;
  const avgWin = MOCK_TRADES.filter(d => d.profit > 0).reduce((sum, d) => sum + d.profit, 0) / (winningDays || 1);
  const avgLoss = MOCK_TRADES.filter(d => d.profit < 0).reduce((sum, d) => sum + d.profit, 0) / (MOCK_TRADES.length - winningDays || 1);
  const profitFactor = Math.abs(avgWin * winningDays / (avgLoss * (MOCK_TRADES.length - winningDays)));
  let maxDD = 0;
  let peak = 25000;
  equityData.forEach(d => {
    if (d.equity > peak) peak = d.equity;
    const dd = (peak - d.equity) / peak;
    if (dd > maxDD) maxDD = dd;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginBottom: '24px',
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Equity Curve"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '300px'
    }
  }, /*#__PURE__*/React.createElement(EquityChart, {
    data: equityData
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Sharpe Ratio"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--acc)'
    }
  }, sharpe.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Sortino Ratio"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--acc)'
    }
  }, isFinite(sortino) ? sortino.toFixed(2) : 'N/A')), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Profit Factor"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, profitFactor.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Max Drawdown"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--red)'
    }
  }, (maxDD * 100).toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Win Rate"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '20px',
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, winRate.toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb",
    style: {
      marginBottom: '6px'
    }
  }, "Avg Win / Loss"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      fontWeight: '700',
      color: 'var(--grn)',
      marginBottom: '2px'
    }
  }, formatCurrency(avgWin)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '14px',
      fontWeight: '700',
      color: 'var(--red)'
    }
  }, formatCurrency(avgLoss)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Daily P&L Distribution"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, MOCK_TRADES.slice(-10).map((trade, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t3)',
      minWidth: '60px'
    }
  }, trade.date), /*#__PURE__*/React.createElement(MiniBar, {
    value: Math.max(0, trade.profit),
    max: 500,
    color: trade.profit >= 0 ? 'var(--grn)' : 'transparent'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: trade.profit >= 0 ? 'var(--grn)' : 'var(--red)',
      fontWeight: '600',
      minWidth: '70px',
      textAlign: 'right'
    }
  }, formatCurrency(trade.profit)))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Performance Summary"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Total Profit"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, formatCurrency(totalProfit))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Total Return"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, formatPct(totalProfit / 25000))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Winning Days"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, winningDays, " / ", MOCK_TRADES.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Best Day"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, formatCurrency(Math.max(...MOCK_TRADES.map(t => t.profit))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, "Worst Day"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      color: 'var(--red)'
    }
  }, formatCurrency(Math.min(...MOCK_TRADES.map(t => t.profit)))))))));
}

// ============================================================================
// REPORTS TAB
// ============================================================================

function Reports() {
  const [reportType, setReportType] = React.useState('summary');
  const [startDate, setStartDate] = React.useState('2026-02-01');
  const [endDate, setEndDate] = React.useState('2026-02-28');
  const [format, setFormat] = React.useState('pdf');
  const [generating, setGenerating] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const reportTypes = [{
    id: 'summary',
    title: 'Performance Summary',
    desc: 'Complete trading overview and metrics'
  }, {
    id: 'consistency',
    title: 'Consistency Report',
    desc: 'Daily consistency ratio analysis'
  }, {
    id: 'cost',
    title: 'Cost Analysis',
    desc: 'Spread, commission and cost breakdown'
  }, {
    id: 'audit',
    title: 'Full Audit',
    desc: 'Complete transaction & rule audit log'
  }];
  const handleGenerate = () => {
    setGenerating(true);
    setReady(false);
    setTimeout(() => {
      setGenerating(false);
      setReady(true);
      setTimeout(() => setReady(false), 3000);
    }, 2000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }
  }, reportTypes.map(rt => /*#__PURE__*/React.createElement("div", {
    key: rt.id,
    onClick: () => setReportType(rt.id),
    style: {
      padding: '16px',
      borderRadius: '8px',
      border: reportType === rt.id ? '2px solid var(--acc)' : '1px solid var(--brd)',
      background: reportType === rt.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--card)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--t1)',
      marginBottom: '4px'
    }
  }, rt.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '11px',
      color: 'var(--t3)'
    }
  }, rt.desc)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      marginBottom: '24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Start Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: startDate,
    onChange: e => setStartDate(e.target.value),
    className: "inp",
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "End Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: endDate,
    onChange: e => setEndDate(e.target.value),
    className: "inp",
    style: {
      width: '100%'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "lb",
    style: {
      display: 'block',
      marginBottom: '8px'
    }
  }, "Format"), /*#__PURE__*/React.createElement("select", {
    value: format,
    onChange: e => setFormat(e.target.value),
    className: "sel",
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "pdf"
  }, "PDF"), /*#__PURE__*/React.createElement("option", {
    value: "xlsx"
  }, "Excel (XLSX)"), /*#__PURE__*/React.createElement("option", {
    value: "docx"
  }, "Word (DOCX)"), /*#__PURE__*/React.createElement("option", {
    value: "pptx"
  }, "PowerPoint (PPTX)")))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-acc",
    onClick: handleGenerate,
    disabled: generating,
    style: {
      width: '100%'
    }
  }, generating ? 'Generating...' : 'Generate Report')), ready && /*#__PURE__*/React.createElement("div", {
    className: `alrt ag`,
    style: {
      padding: '16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      marginBottom: '2px'
    }
  }, "Report Ready"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      opacity: 0.8
    }
  }, "Your ", reportType, " report is ready to download."))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Report Preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg2)',
      padding: '20px',
      borderRadius: '6px',
      lineHeight: '1.6',
      fontSize: '12px',
      color: 'var(--t3)',
      fontFamily: 'monospace'
    }
  }, /*#__PURE__*/React.createElement("div", null, "PROPEDGE TRADING REPORT"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '12px'
    }
  }, "Account: 2-Step Pro ($25,000)"), /*#__PURE__*/React.createElement("div", null, "Period: ", startDate, " to ", endDate), /*#__PURE__*/React.createElement("div", null, "Format: ", format.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '12px',
      color: 'var(--t2)'
    }
  }, "Report includes:"), /*#__PURE__*/React.createElement("div", null, "\u2022 Performance metrics and analytics"), /*#__PURE__*/React.createElement("div", null, "\u2022 Daily P&L breakdown"), /*#__PURE__*/React.createElement("div", null, "\u2022 Risk analysis"), /*#__PURE__*/React.createElement("div", null, "\u2022 Compliance audit trail"))));
}

// ============================================================================
// COMMUNITY TAB
// ============================================================================

function Community() {
  const countryFlags = {
    'US': '🇺🇸',
    'UK': '🇬🇧',
    'SG': '🇸🇬',
    'AU': '🇦🇺',
    'CA': '🇨🇦',
    'DE': '🇩🇪',
    'JP': '🇯🇵',
    'NL': '🇳🇱'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingLeft: '240px',
      paddingTop: '64px',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '24px 24px 24px 264px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '24px',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, var(--acc), #2dd4bf)',
      color: 'white'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 8px 0',
      fontSize: '18px',
      fontWeight: '700'
    }
  }, "Week 9 Challenge"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '13px',
      opacity: 0.9
    }
  }, "Achieve 15+ winning days this week for a 50% commission rebate!"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ptrack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pfill",
    style: {
      width: '62%',
      background: 'rgba(255,255,255,0.3)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      fontWeight: '600',
      minWidth: '50px'
    }
  }, "9 / 15 days"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 16px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--t1)'
    }
  }, "Global Leaderboard - February"), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: '1px solid var(--brd)'
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px',
      width: '40px'
    }
  }, "Rank"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px'
    }
  }, "Trader"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'left',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px',
      width: '60px'
    }
  }, "Region"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'right',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px',
      width: '100px'
    }
  }, "Profit"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      textAlign: 'right',
      color: 'var(--t2)',
      fontWeight: '600',
      fontSize: '11px',
      width: '80px'
    }
  }, "Win Rate"))), /*#__PURE__*/React.createElement("tbody", null, MOCK_LEADERBOARD.map((trader, i) => /*#__PURE__*/React.createElement("tr", {
    key: trader.rank,
    style: {
      borderBottom: '1px solid var(--brd)',
      background: trader.rank <= 3 ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 8px',
      color: 'var(--t1)',
      fontWeight: '600'
    }
  }, trader.rank <= 3 ? ['🥇', '🥈', '🥉'][trader.rank - 1] : trader.rank), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 8px',
      color: 'var(--t1)',
      fontWeight: '500'
    }
  }, trader.name), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 8px',
      color: 'var(--t2)',
      fontSize: '12px'
    }
  }, trader.country), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 8px',
      textAlign: 'right',
      color: 'var(--grn)',
      fontWeight: '600'
    }
  }, formatCurrency(trader.profit)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 8px',
      textAlign: 'right',
      color: 'var(--t1)',
      fontWeight: '600'
    }
  }, trader.winRate, "%")))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: '20px',
      marginTop: '16px',
      background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(45,212,191,0.05))',
      border: '1px solid var(--acc)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t2)',
      fontWeight: '600',
      marginBottom: '4px',
      textTransform: 'uppercase'
    }
  }, "Your Position"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '16px',
      fontWeight: '700',
      color: 'var(--acc)'
    }
  }, "10th Place"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)',
      marginTop: '4px'
    }
  }, "You are 1,085 profit behind 9th")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--grn)'
    }
  }, formatCurrency(6850)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '12px',
      color: 'var(--t3)'
    }
  }, "Monthly Profit")))));
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return /*#__PURE__*/React.createElement(Dashboard, null);
      case 'news':
        return /*#__PURE__*/React.createElement(NewsMonitor, null);
      case 'consistency':
        return /*#__PURE__*/React.createElement(ConsistencyCalculator, null);
      case 'costcalc':
        return /*#__PURE__*/React.createElement(CostCalculator, null);
      case 'rules':
        return /*#__PURE__*/React.createElement(RuleAcknowledgement, null);
      case 'coach':
        return /*#__PURE__*/React.createElement(AICoach, null);
      case 'analytics':
        return /*#__PURE__*/React.createElement(Analytics, null);
      case 'reports':
        return /*#__PURE__*/React.createElement(Reports, null);
      case 'community':
        return /*#__PURE__*/React.createElement(Community, null);
      default:
        return /*#__PURE__*/React.createElement(Dashboard, null);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg)',
      color: 'var(--t1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), /*#__PURE__*/React.createElement(TopBar, null), renderTab());
}

// ============================================================================
// RENDER APP
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));