const {
  useState,
  useEffect,
  useRef,
  useCallback
} = React;

// ============================================================
// CONSTANTS — INSTRUMENTS, PIP VALUES (from Technical Report)
// ============================================================
const INSTRUMENTS = {
  'EURUSD': {
    name: 'EUR/USD',
    spread: 0.2,
    pipValue: 10,
    category: 'Forex Major',
    warning: null
  },
  'GBPUSD': {
    name: 'GBP/USD',
    spread: 0.3,
    pipValue: 10,
    category: 'Forex Major',
    warning: null
  },
  'USDJPY': {
    name: 'USD/JPY',
    spread: 0.4,
    pipValue: 9.09,
    category: 'Forex Major',
    warning: null
  },
  'USDCHF': {
    name: 'USD/CHF',
    spread: 0.3,
    pipValue: 10,
    category: 'Forex Major',
    warning: null
  },
  'AUDUSD': {
    name: 'AUD/USD',
    spread: 0.3,
    pipValue: 10,
    category: 'Forex Major',
    warning: null
  },
  'NZDUSD': {
    name: 'NZD/USD',
    spread: 0.4,
    pipValue: 10,
    category: 'Forex Minor',
    warning: null
  },
  'XAUUSD': {
    name: 'XAU/USD (Gold)',
    spread: 0.18,
    pipValue: 10,
    category: 'Metals',
    warning: null
  },
  'XAGUSD': {
    name: 'XAG/USD (Silver)',
    spread: 0.35,
    pipValue: 50,
    category: 'Metals',
    warning: '⚠️ XAG pip value = $50/lot (5× EURUSD). 2.5 lots can wipe your ENTIRE daily limit in spread alone.'
  },
  'US30': {
    name: 'US30 (Dow Jones)',
    spread: 0.5,
    pipValue: 10,
    category: 'Indices',
    warning: null
  },
  'US100': {
    name: 'NAS100 (Nasdaq)',
    spread: 0.4,
    pipValue: 10,
    category: 'Indices',
    warning: null
  },
  'BTCUSD': {
    name: 'BTC/USD',
    spread: 15,
    pipValue: 1,
    category: 'Crypto',
    warning: '⚠️ Crypto spreads are highly volatile. Costs shown are estimates only.'
  }
};
const ACCOUNT_TYPES = {
  '2-step-standard': {
    name: '2-Step Standard',
    dailyLimit: 0.05,
    maxDD: 0.10,
    consistencyCap: null
  },
  '2-step-pro': {
    name: '2-Step Pro',
    dailyLimit: 0.03,
    maxDD: 0.06,
    consistencyCap: 0.45
  },
  '1-step': {
    name: '1-Step',
    dailyLimit: 0.05,
    maxDD: 0.10,
    consistencyCap: null
  },
  'zero': {
    name: 'Zero',
    dailyLimit: 0.03,
    maxDD: 0.06,
    consistencyCap: 0.15
  }
};
const PAYOUT_TYPES = {
  'on-demand': {
    name: 'On-Demand',
    consistencyCap: 0.35
  },
  'bi-weekly': {
    name: 'Bi-Weekly',
    consistencyCap: null
  },
  'weekly': {
    name: 'Weekly',
    consistencyCap: null
  },
  '2-step-pro': {
    name: 'Pro Payout',
    consistencyCap: 0.45
  }
};

// Mock trade history — 9 days in current payout cycle
const MOCK_TRADES = [{
  date: '2026-02-17',
  profit: 800,
  trades: 4
}, {
  date: '2026-02-18',
  profit: 600,
  trades: 3
}, {
  date: '2026-02-19',
  profit: -320,
  trades: 5
}, {
  date: '2026-02-20',
  profit: 1500,
  trades: 6
},
// Best day — potential violation
{
  date: '2026-02-21',
  profit: 0,
  trades: 0
}, {
  date: '2026-02-24',
  profit: 400,
  trades: 3
}, {
  date: '2026-02-25',
  profit: 300,
  trades: 2
}, {
  date: '2026-02-26',
  profit: 350,
  trades: 4
}, {
  date: '2026-02-27',
  profit: 150,
  trades: 2
} // Today (partial)
];

// Today's high-impact news (mock — real version uses JBlanked API)
const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const NEWS_EVENTS = [{
  name: 'Non-Farm Payrolls',
  currency: 'USD',
  hour: now.getHours() + 1,
  minute: 30,
  impact: 'High',
  forecast: '180K',
  previous: '256K',
  windowMins: 10
}, {
  name: 'Fed Interest Rate Decision',
  currency: 'USD',
  hour: now.getHours() + 3,
  minute: 0,
  impact: 'High',
  forecast: '4.50%',
  previous: '4.50%',
  windowMins: 10
}, {
  name: 'ECB Press Conference',
  currency: 'EUR',
  hour: now.getHours() + 5,
  minute: 45,
  impact: 'High',
  forecast: null,
  previous: null,
  windowMins: 5
}, {
  name: 'CPI (YoY)',
  currency: 'GBP',
  hour: now.getHours() + 7,
  minute: 0,
  impact: 'Medium',
  forecast: '2.8%',
  previous: '2.5%',
  windowMins: 5
}];
const MOCK_RULES = [{
  id: 'r1',
  title: 'News Trading Restriction — Extended Window',
  category: 'trading',
  effectiveDate: '2026-02-28',
  oldText: 'Trading is restricted 5 minutes before and 5 minutes after high-impact news events.',
  newText: 'Trading is restricted 10 minutes before and 10 minutes after high-impact news events. This restriction now applies to ALL account types including Master phase accounts. Trades opened or closed within this window will have profits excluded from payout calculations.',
  affectedAccounts: ['All Account Types'],
  acknowledged: false
}, {
  id: 'r2',
  title: 'Consistency Rule — On-Demand Payout Cap Update',
  category: 'payout',
  effectiveDate: '2026-03-01',
  oldText: 'On-demand payout requests are subject to a 40% single-day consistency cap.',
  newText: 'On-demand payout requests are now subject to a 35% single-day consistency cap (reduced from 40%). Any single trading day profit must not exceed 35% of total cycle profits at time of payout request.',
  affectedAccounts: ['On-Demand Payout Accounts'],
  acknowledged: false
}];
const MOCK_POSITIONS = [{
  symbol: 'EURUSD',
  side: 'BUY',
  lots: 1.5,
  openPrice: 1.0821,
  profit: 145,
  risk: false
}, {
  symbol: 'XAUUSD',
  side: 'SELL',
  lots: 0.5,
  openPrice: 2645.20,
  profit: -38,
  risk: true
}];
const MOCK_LEADERBOARD = [{
  rank: 1,
  name: 'Trader_AX91',
  profit: 12400,
  winRate: 72,
  country: '🇦🇪'
}, {
  rank: 2,
  name: 'FX_Master_22',
  profit: 9800,
  winRate: 68,
  country: '🇬🇧'
}, {
  rank: 3,
  name: 'PipHunter_K',
  profit: 8600,
  winRate: 65,
  country: '🇮🇳'
}, {
  rank: 4,
  name: 'You',
  profit: 3780,
  winRate: 58,
  country: '🇮🇳',
  isYou: true
}, {
  rank: 5,
  name: 'GoldTrader_7',
  profit: 3200,
  winRate: 55,
  country: '🇺🇸'
}];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function formatCurrency(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  const str = abs >= 1000 ? '$' + (abs / 1000).toFixed(1) + 'K' : '$' + abs.toFixed(2);
  return n < 0 ? '-' + str : str;
}
function formatSeconds(s) {
  if (s <= 0) return '00:00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}

// F5: Consistency Rule Engine — exact formula from Technical Report
function calculateConsistency(trades, payoutType, accountType) {
  const config = ACCOUNT_TYPES[accountType] || ACCOUNT_TYPES['2-step-standard'];
  const payoutConfig = PAYOUT_TYPES[payoutType] || PAYOUT_TYPES['on-demand'];

  // Account-level cap takes priority (Zero = always 15%)
  const cap = accountType === 'zero' ? 0.15 : payoutConfig.consistencyCap || config.consistencyCap;
  const dailyPnL = {};
  trades.forEach(t => {
    dailyPnL[t.date] = t.profit;
  });
  const totalProfit = Object.values(dailyPnL).reduce((a, b) => a + b, 0);
  const profitDays = Object.values(dailyPnL).filter(p => p > 0);
  const bestDayProfit = profitDays.length ? Math.max(...profitDays) : 0;
  const bestDayDate = Object.keys(dailyPnL).find(d => dailyPnL[d] === bestDayProfit) || '';
  const todayKey = new Date().toISOString().split('T')[0];
  const todayPnL = dailyPnL[todayKey] || 0;

  // Formula: maxToday = (cap × totalProfit) / (1 - cap) - todayPnLSoFar
  const maxToday = cap ? Math.max(0, cap * totalProfit / (1 - cap) - Math.max(todayPnL, 0)) : Infinity;
  const currentRatio = totalProfit > 0 ? bestDayProfit / totalProfit : 0;
  const isViolating = cap ? currentRatio > cap : false;
  const daysTraded = trades.filter(t => t.profit !== 0).length;
  const winDays = trades.filter(t => t.profit > 0).length;
  return {
    totalProfit,
    bestDayProfit,
    bestDayDate,
    cap,
    isViolating,
    currentRatio,
    maxToday,
    dailyPnL,
    todayPnL,
    daysTraded,
    winDays,
    hasCap: !!cap
  };
}

// F4: True Cost Calculator — exact formula from Technical Report
function calculateTrueCost(instrumentKey, lotSize, accountType, accountSize) {
  const instrument = INSTRUMENTS[instrumentKey];
  const acctConfig = ACCOUNT_TYPES[accountType] || ACCOUNT_TYPES['2-step-standard'];
  if (!instrument || !lotSize || !accountSize) return null;
  const spread = instrument.spread;
  const pipValue = instrument.pipValue;
  const commission = 2.0 * lotSize; // $2/lot round-trip (industry standard)
  const spreadCost = spread * pipValue * lotSize;
  const totalEntryCost = spreadCost + commission;
  const dailyLimitUSD = accountSize * acctConfig.dailyLimit;
  const pctOfDailyLimit = totalEntryCost / dailyLimitUSD * 100;
  const maxProfitRule = accountSize * 0.03;
  const breaksEvenAt = totalEntryCost / (pipValue * lotSize);
  return {
    spread,
    spreadCost,
    commission,
    totalEntryCost,
    dailyLimitUSD,
    pctOfDailyLimit,
    maxProfitRule,
    breaksEvenAt,
    pipValue,
    warning: instrument.warning,
    riskLevel: pctOfDailyLimit > 20 ? 'HIGH' : pctOfDailyLimit > 10 ? 'MEDIUM' : 'LOW'
  };
}
function getEquityCurve(trades) {
  let equity = 0;
  return trades.map(t => {
    equity += t.profit;
    return {
      date: t.date.slice(5),
      equity
    };
  });
}

// ============================================================
// SIDEBAR
// ============================================================
const NAV_ITEMS = [{
  id: 'dashboard',
  icon: '⬛',
  label: 'Dashboard',
  badge: null
}, {
  id: 'news',
  icon: '📰',
  label: 'News Monitor',
  badge: '🔴'
}, {
  id: 'consistency',
  icon: '📈',
  label: 'Consistency',
  badge: '⚠️'
}, {
  id: 'cost',
  icon: '💸',
  label: 'Cost Calculator',
  badge: null
}, {
  id: 'rules',
  icon: '📋',
  label: 'Rule Centre',
  badge: '2'
}, {
  id: 'coach',
  icon: '🤖',
  label: 'AI Coach',
  badge: null
}, {
  id: 'analytics',
  icon: '📊',
  label: 'Analytics',
  badge: null
}, {
  id: 'reports',
  icon: '📄',
  label: 'Reports',
  badge: null
}, {
  id: 'community',
  icon: '🏆',
  label: 'Community',
  badge: null
}];
function Sidebar({
  activeTab,
  setActiveTab
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      minHeight: '100vh',
      background: '#080E1A',
      borderRight: '1px solid #1E293B',
      padding: '0',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 16px 16px',
      borderBottom: '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: 14,
      color: 'white'
    }
  }, "PE"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: 0.5
    }
  }, "PropEdge"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 10
    }
  }, "Powered by FundingPips")))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 12px',
      background: '#0F172A',
      border: '1px solid #1E293B',
      borderRadius: 8,
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 11
    }
  }, "ACCOUNT"), /*#__PURE__*/React.createElement("span", {
    className: "badge tag-green",
    style: {
      fontSize: 10
    }
  }, "FUNDED")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 13,
      marginTop: 4
    }
  }, "$25,000 \xB7 2-Step"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 10
    }
  }, "Payout Progress"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#34D399',
      fontSize: 10,
      fontWeight: 700
    }
  }, "75%")), /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-bg",
    style: {
      height: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-fill",
    style: {
      width: '75%',
      background: 'linear-gradient(90deg,#10B981,#059669)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '4px 10px',
      overflowY: 'auto'
    }
  }, NAV_ITEMS.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: `nav-item ${activeTab === item.id ? 'active' : ''}`,
    style: {
      color: activeTab === item.id ? 'white' : '#94A3B8',
      marginBottom: 2
    },
    onClick: () => setActiveTab(item.id)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, item.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: activeTab === item.id ? 700 : 400
    }
  }, item.label), item.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: item.badge === '🔴' || item.badge === '⚠️' ? 14 : 10,
      background: item.badge.length > 1 ? 'transparent' : '#EF4444',
      borderRadius: 999,
      padding: item.badge.length > 1 ? '0' : '1px 6px',
      color: 'white',
      fontWeight: 700
    }
  }, item.badge)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderTop: '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      fontSize: 10,
      color: '#475569'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCA1 Skills"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD17 KW Plugins"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCA FS Plugins")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#1E40AF',
      fontSize: 10,
      marginTop: 4
    }
  }, "v2.0 \xB7 All 3 Repos Active")));
}

// ============================================================
// DASHBOARD (Overview)
// ============================================================
function Dashboard({
  setActiveTab
}) {
  const consistency = calculateConsistency(MOCK_TRADES, 'on-demand', '2-step-standard');
  const firstNews = NEWS_EVENTS[0];
  const nowSecs = new Date();
  const eventTime = new Date();
  eventTime.setHours(firstNews.hour, firstNews.minute, 0);
  const secsToEvent = Math.max(0, Math.floor((eventTime - nowSecs) / 1000));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "Dashboard"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Real-time intelligence for your FundingPips account")), consistency.isViolating && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, "\uD83D\uDEA8"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontWeight: 700,
      fontSize: 14
    }
  }, "Consistency Rule Violation Detected"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FCA5A5',
      fontSize: 12
    }
  }, "Your best day (", formatCurrency(consistency.bestDayProfit), ") is ", (consistency.currentRatio * 100).toFixed(1), "% of total profit \u2014 exceeds your 35% cap. ", /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    onClick: () => setActiveTab('consistency')
  }, "View Details \u2192")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer'
    },
    onClick: () => setActiveTab('rules')
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, "\uD83D\uDCCB"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FBBF24',
      fontWeight: 700,
      fontSize: 14
    }
  }, "2 Rule Changes Require Your Acknowledgement"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FCD34D',
      fontSize: 12
    }
  }, "Effective Feb 28 & Mar 1 \u2014 review and acknowledge to avoid payout delays")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#FBBF24',
      fontSize: 18
    }
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14,
      marginBottom: 20
    }
  }, [{
    label: 'Cycle Profit',
    value: formatCurrency(consistency.totalProfit),
    sub: '9 trading days',
    color: '#34D399',
    icon: '💰'
  }, {
    label: 'Consistency Score',
    value: consistency.isViolating ? 'VIOLATING' : ((1 - consistency.currentRatio / consistency.cap) * 100).toFixed(0) + '% Safe',
    sub: `Best day: ${(consistency.currentRatio * 100).toFixed(1)}% of total`,
    color: consistency.isViolating ? '#F87171' : '#34D399',
    icon: '📏'
  }, {
    label: 'Max Today',
    value: consistency.hasCap ? formatCurrency(consistency.maxToday) : 'No Cap',
    sub: 'Before consistency violation',
    color: '#60A5FA',
    icon: '🎯'
  }, {
    label: 'Next News',
    value: formatSeconds(secsToEvent),
    sub: firstNews.name,
    color: secsToEvent < 1800 ? '#F87171' : '#FBBF24',
    icon: '📰'
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 12,
      fontWeight: 600
    }
  }, s.label.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, s.icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: s.color,
      fontSize: 22,
      fontWeight: 800,
      margin: '8px 0 4px'
    }
  }, s.value), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, s.sub)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "FEATURE STATUS"), [{
    name: 'News Monitor (F6)',
    status: 'ACTIVE',
    color: '#34D399',
    desc: `Next event in ${formatSeconds(secsToEvent)}`
  }, {
    name: 'Consistency Guard (F5)',
    status: consistency.isViolating ? 'ALERT' : 'SAFE',
    color: consistency.isViolating ? '#F87171' : '#34D399',
    desc: `${(consistency.currentRatio * 100).toFixed(1)}% / ${consistency.cap ? consistency.cap * 100 + '%' : 'No'} cap`
  }, {
    name: 'Cost Calculator (F4)',
    status: 'READY',
    color: '#60A5FA',
    desc: 'XAG warning enabled'
  }, {
    name: 'Rule Centre (F3)',
    status: '2 PENDING',
    color: '#FBBF24',
    desc: 'Acknowledgement required'
  }].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: i < 3 ? '1px solid #1E293B' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#E2E8F0',
      fontSize: 13,
      fontWeight: 600
    }
  }, f.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11,
      marginTop: 2
    }
  }, f.desc)), /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: f.color + '22',
      color: f.color,
      border: `1px solid ${f.color}55`
    }
  }, f.status)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "OPEN POSITIONS"), MOCK_POSITIONS.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      border: p.risk ? '1px solid rgba(239,68,68,0.3)' : '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: p.side === 'BUY' ? '#065F4622' : '#7F1D1D22',
      color: p.side === 'BUY' ? '#34D399' : '#F87171',
      border: `1px solid ${p.side === 'BUY' ? '#34D39944' : '#F8717144'}`
    }
  }, p.side), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 13
    }
  }, p.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 12
    }
  }, p.lots, " lots")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: p.profit > 0 ? '#34D399' : '#F87171',
      fontWeight: 700
    }
  }, formatCurrency(p.profit))), p.risk && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontSize: 11,
      marginTop: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u26A0\uFE0F"), " At risk during upcoming NFP \u2014 consider closing before 13:20 UTC"))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11,
      marginTop: 8
    }
  }, "Connected via TradeLocker API \xB7 Live data"))));
}

// ============================================================
// F6: NEWS MONITOR
// ============================================================
function NewsMonitor() {
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState('SAFE');
  useEffect(() => {
    const tick = () => {
      const now2 = new Date();
      const next = NEWS_EVENTS[0];
      const eventTime = new Date();
      eventTime.setHours(next.hour, next.minute, 0, 0);
      const secs = Math.max(0, Math.floor((eventTime - now2) / 1000));
      setCountdown(secs);
      if (secs === 0) setStatus('ACTIVE');else if (secs < next.windowMins * 60) setStatus('RESTRICTED');else if (secs < 1800) setStatus('WARNING');else setStatus('SAFE');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const statusConfig = {
    SAFE: {
      color: '#34D399',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.4)',
      label: '✅ SAFE TO TRADE',
      glowClass: 'glow-green'
    },
    WARNING: {
      color: '#FBBF24',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.4)',
      label: '⚠️ NEWS APPROACHING',
      glowClass: 'glow-amber'
    },
    RESTRICTED: {
      color: '#F87171',
      bg: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.5)',
      label: '🚫 RESTRICTED WINDOW',
      glowClass: 'glow-red'
    },
    ACTIVE: {
      color: '#F87171',
      bg: 'rgba(239,68,68,0.2)',
      border: 'rgba(239,68,68,0.6)',
      label: '🔴 NEWS ACTIVE — STOP!',
      glowClass: 'glow-red pulse-red'
    }
  };
  const sc = statusConfig[status];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCF0 News Monitor"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Real-time countdown to restricted trading windows \xB7 Powered by JBlanked + RapidAPI")), /*#__PURE__*/React.createElement("div", {
    className: `${sc.glowClass}`,
    style: {
      background: sc.bg,
      border: `2px solid ${sc.border}`,
      borderRadius: 16,
      padding: 28,
      textAlign: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: sc.color,
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: 2,
      marginBottom: 12
    }
  }, sc.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'white',
      fontWeight: 900,
      fontSize: 64,
      letterSpacing: 8,
      fontFamily: 'monospace'
    }
  }, formatSeconds(countdown)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: sc.color,
      fontSize: 14,
      marginTop: 8
    }
  }, "Until: ", NEWS_EVENTS[0].name, " (", NEWS_EVENTS[0].currency, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 12,
      marginTop: 4
    }
  }, "Restricted window: ", NEWS_EVENTS[0].windowMins, " mins before & after")), MOCK_POSITIONS.filter(p => p.risk).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239,68,68,0.1)',
      border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 8
    }
  }, "\uD83D\uDEA8 Open Position At Risk"), MOCK_POSITIONS.filter(p => p.risk).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: '#FCA5A5',
      fontSize: 13
    }
  }, "Your ", p.symbol, " ", p.side, " (", p.lots, " lots) is open. Holding through the ", NEWS_EVENTS[0].name, " window means profits from this position may NOT count toward your payout. Close by ", NEWS_EVENTS[0].hour, ":", String(NEWS_EVENTS[0].minute - NEWS_EVENTS[0].windowMins).padStart(2, '0'), " UTC."))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "TODAY'S HIGH-IMPACT EVENTS"), NEWS_EVENTS.map((e, i) => {
    const eTime = new Date();
    eTime.setHours(e.hour, e.minute, 0);
    const secsDiff = Math.floor((eTime - new Date()) / 1000);
    const isPast = secsDiff < 0;
    const isNext = i === 0;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        background: isNext ? 'rgba(59,130,246,0.08)' : '#162032',
        borderRadius: 8,
        marginBottom: 8,
        border: isNext ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1E293B',
        opacity: isPast ? 0.5 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: '#F1F5F9',
        fontWeight: 700,
        fontSize: 15
      }
    }, e.hour, ":", String(e.minute).padStart(2, '0')), /*#__PURE__*/React.createElement("div", {
      style: {
        color: '#475569',
        fontSize: 10
      }
    }, "UTC")), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 2,
        height: 36,
        background: e.impact === 'High' ? '#EF4444' : '#F59E0B',
        borderRadius: 1
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#F1F5F9',
        fontWeight: 700,
        fontSize: 13
      }
    }, e.name), /*#__PURE__*/React.createElement("span", {
      className: "badge",
      style: {
        background: '#1E293B',
        color: '#94A3B8',
        fontSize: 10
      }
    }, e.currency), isNext && /*#__PURE__*/React.createElement("span", {
      className: "badge tag-blue",
      style: {
        fontSize: 10
      }
    }, "NEXT")), /*#__PURE__*/React.createElement("div", {
      style: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 3
      }
    }, "Window: \xB1", e.windowMins, " minutes \xB7 ", e.forecast ? `Forecast: ${e.forecast}` : 'No forecast', " ", e.previous ? `· Previous: ${e.previous}` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge",
      style: {
        background: e.impact === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
        color: e.impact === 'High' ? '#F87171' : '#FBBF24',
        border: `1px solid ${e.impact === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
      }
    }, e.impact), !isPast && /*#__PURE__*/React.createElement("div", {
      style: {
        color: '#475569',
        fontSize: 10,
        marginTop: 4
      }
    }, secsDiff < 3600 ? Math.floor(secsDiff / 60) + 'm' : Math.floor(secsDiff / 3600) + 'h ' + Math.floor(secsDiff % 3600 / 60) + 'm')));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#334155',
      fontSize: 11,
      marginTop: 12,
      textAlign: 'center'
    }
  }, "\uD83D\uDCE1 Live data from JBlanked Calendar API + RapidAPI Economic Calendar \xB7 Updates every 60s \xB7 V2 includes per-currency position matching"));
}

// ============================================================
// F5: CONSISTENCY CALCULATOR
// ============================================================
function ConsistencyCalculator() {
  const [payoutType, setPayoutType] = useState('on-demand');
  const [accountType, setAccountType] = useState('2-step-standard');
  const calc = calculateConsistency(MOCK_TRADES, payoutType, accountType);
  const equityCurve = getEquityCurve(MOCK_TRADES);
  const maxEquity = Math.max(...equityCurve.map(e => Math.abs(e.equity)));
  const chartW = 480,
    chartH = 80;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCC8 Consistency Rule Calculator"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Live tracking \xB7 Formula: Max Today = (cap \xD7 totalProfit) / (1 \u2212 cap) \u2212 todayPnL")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      color: '#94A3B8',
      fontSize: 11,
      display: 'block',
      marginBottom: 4
    }
  }, "ACCOUNT TYPE"), /*#__PURE__*/React.createElement("select", {
    value: accountType,
    onChange: e => setAccountType(e.target.value)
  }, Object.entries(ACCOUNT_TYPES).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      color: '#94A3B8',
      fontSize: 11,
      display: 'block',
      marginBottom: 4
    }
  }, "PAYOUT TYPE"), /*#__PURE__*/React.createElement("select", {
    value: payoutType,
    onChange: e => setPayoutType(e.target.value)
  }, Object.entries(PAYOUT_TYPES).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, v.name))))), calc.isViolating && /*#__PURE__*/React.createElement("div", {
    className: "glow-red pulse-red",
    style: {
      background: 'rgba(239,68,68,0.12)',
      border: '2px solid rgba(239,68,68,0.5)',
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontWeight: 800,
      fontSize: 15
    }
  }, "\uD83D\uDEA8 CONSISTENCY RULE VIOLATION"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FCA5A5',
      fontSize: 13,
      marginTop: 6
    }
  }, "Your best day (", new Date(calc.bestDayDate).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric'
  }), ": ", /*#__PURE__*/React.createElement("strong", null, formatCurrency(calc.bestDayProfit)), ") is ", /*#__PURE__*/React.createElement("strong", null, (calc.currentRatio * 100).toFixed(1), "%"), " of your total cycle profit \u2014 exceeding the ", /*#__PURE__*/React.createElement("strong", null, calc.cap ? calc.cap * 100 + '%' : '—', "%"), " cap."), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FCA5A5',
      fontSize: 12,
      marginTop: 6
    }
  }, "\u26A0\uFE0F If you request a payout now, it will be denied. Continue trading to dilute the best-day ratio, or switch to a payout type with no consistency rule.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      marginBottom: 16
    }
  }, [{
    label: 'CYCLE TOTAL PROFIT',
    value: formatCurrency(calc.totalProfit),
    color: calc.totalProfit > 0 ? '#34D399' : '#F87171'
  }, {
    label: 'BEST DAY PROFIT',
    value: formatCurrency(calc.bestDayProfit),
    color: '#60A5FA',
    sub: calc.bestDayDate ? new Date(calc.bestDayDate).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric'
    }) : ''
  }, {
    label: 'CONSISTENCY RATIO',
    value: calc.hasCap ? `${(calc.currentRatio * 100).toFixed(1)}%` : 'N/A',
    color: calc.isViolating ? '#F87171' : '#34D399',
    sub: `Cap: ${calc.cap ? calc.cap * 100 + '%' : 'None'}`
  }, {
    label: 'TODAY\'S P&L',
    value: formatCurrency(calc.todayPnL),
    color: calc.todayPnL > 0 ? '#34D399' : calc.todayPnL < 0 ? '#F87171' : '#64748B'
  }, {
    label: 'MAX PROFIT TODAY',
    value: calc.hasCap ? calc.maxToday === Infinity ? 'Unlimited' : formatCurrency(calc.maxToday) : 'No Cap',
    color: '#FBBF24',
    sub: 'Without violating cap'
  }, {
    label: 'TRADING DAYS',
    value: `${calc.winDays}W / ${calc.daysTraded - calc.winDays}L`,
    color: '#94A3B8',
    sub: `${calc.daysTraded} total days`
  }].map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "card-inner",
    style: {
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5
    }
  }, m.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: m.color,
      fontWeight: 800,
      fontSize: 20,
      margin: '4px 0 2px'
    }
  }, m.value), m.sub && /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10
    }
  }, m.sub)))), calc.hasCap && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700
    }
  }, "CONSISTENCY GAUGE"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: calc.isViolating ? '#F87171' : '#34D399',
      fontSize: 12,
      fontWeight: 700
    }
  }, (calc.currentRatio * 100).toFixed(1), "% used of ", calc.cap * 100, "% cap")), /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-bg",
    style: {
      height: 18,
      borderRadius: 999,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-fill",
    style: {
      width: Math.min(calc.currentRatio / calc.cap * 100, 100) + '%',
      background: calc.isViolating ? 'linear-gradient(90deg,#EF4444,#DC2626)' : calc.currentRatio / calc.cap > 0.85 ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#10B981,#059669)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -4,
      left: '100%',
      transform: 'translateX(-1px)',
      width: 2,
      height: 26,
      background: '#EF4444',
      borderRadius: 1
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontSize: 10
    }
  }, "0%"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#EF4444',
      fontSize: 10,
      fontWeight: 700
    }
  }, "Cap: ", calc.cap * 100, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "DAILY P&L \u2014 CURRENT CYCLE"), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${MOCK_TRADES.length * 52} 100`,
    style: {
      overflow: 'visible'
    }
  }, MOCK_TRADES.map((t, i) => {
    const maxV = Math.max(...MOCK_TRADES.map(d => Math.abs(d.profit)), 1);
    const barH = Math.abs(t.profit) / maxV * 44;
    const x = i * 52 + 4;
    const isToday = t.date === new Date().toISOString().split('T')[0];
    const isBest = t.profit === Math.max(...MOCK_TRADES.map(d => d.profit));
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("rect", {
      x: x,
      y: t.profit >= 0 ? 50 - barH : 50,
      width: 44,
      height: barH || 2,
      fill: isBest ? '#F59E0B' : t.profit > 0 ? '#10B981' : '#EF4444',
      opacity: isToday ? 1 : 0.7,
      rx: 4
    }), isBest && /*#__PURE__*/React.createElement("text", {
      x: x + 22,
      y: 50 - barH - 5,
      textAnchor: "middle",
      fill: "#F59E0B",
      fontSize: "8",
      fontWeight: "700"
    }, "BEST"), /*#__PURE__*/React.createElement("text", {
      x: x + 22,
      y: 96,
      textAnchor: "middle",
      fill: "#475569",
      fontSize: "8"
    }, t.date.slice(5)), /*#__PURE__*/React.createElement("text", {
      x: x + 22,
      y: t.profit >= 0 ? 50 - barH - 2 : 50 + barH + 10,
      textAnchor: "middle",
      fill: t.profit > 0 ? '#34D399' : '#F87171',
      fontSize: "7"
    }, t.profit > 0 ? '+' : '', (t.profit / 1000).toFixed(1), "K"));
  }), /*#__PURE__*/React.createElement("line", {
    x1: 0,
    y1: 50,
    x2: MOCK_TRADES.length * 52,
    y2: 50,
    stroke: "#1E293B",
    strokeWidth: 1
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      background: '#F59E0B',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 11
    }
  }, "Best Day")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      background: '#10B981',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 11
    }
  }, "Profit")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 10,
      height: 10,
      background: '#EF4444',
      borderRadius: 2
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 11
    }
  }, "Loss")))));
}

// ============================================================
// F4: COST CALCULATOR
// ============================================================
function CostCalculator() {
  const [instrument, setInstrument] = useState('EURUSD');
  const [lotSize, setLotSize] = useState(1);
  const [accountType, setAccountType] = useState('2-step-standard');
  const [accountSize, setAccountSize] = useState(25000);
  const result = calculateTrueCost(instrument, lotSize, accountType, accountSize);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCB8 True Cost Calculator"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Know your REAL entry cost before every trade \xB7 Spread + Commission + Daily limit impact")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '340px 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "TRADE SETUP"), [{
    label: 'INSTRUMENT',
    content: /*#__PURE__*/React.createElement("select", {
      value: instrument,
      onChange: e => setInstrument(e.target.value)
    }, Object.entries(INSTRUMENTS).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
      key: k,
      value: k
    }, v.name)))
  }, {
    label: 'LOT SIZE',
    content: /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: 0.01,
      step: 0.01,
      value: lotSize,
      onChange: e => setLotSize(parseFloat(e.target.value) || 0)
    })
  }, {
    label: 'ACCOUNT TYPE',
    content: /*#__PURE__*/React.createElement("select", {
      value: accountType,
      onChange: e => setAccountType(e.target.value)
    }, Object.entries(ACCOUNT_TYPES).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
      key: k,
      value: k
    }, v.name)))
  }, {
    label: 'ACCOUNT SIZE ($)',
    content: /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: 1000,
      value: accountSize,
      onChange: e => setAccountSize(parseInt(e.target.value) || 0)
    })
  }].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      display: 'block',
      marginBottom: 4
    }
  }, f.label), f.content)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#060B18',
      borderRadius: 8,
      padding: '10px 12px',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 11,
      marginBottom: 4
    }
  }, "INSTRUMENT SPECS"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontSize: 12
    }
  }, "Current Spread"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 12
    }
  }, INSTRUMENTS[instrument].spread, " pips")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontSize: 12
    }
  }, "Pip Value/Lot"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: INSTRUMENTS[instrument].pipValue >= 50 ? '#F87171' : '#F1F5F9',
      fontWeight: 700,
      fontSize: 12
    }
  }, "$", INSTRUMENTS[instrument].pipValue)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontSize: 12
    }
  }, "Category"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#60A5FA',
      fontSize: 12
    }
  }, INSTRUMENTS[instrument].category)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, result?.warning && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239,68,68,0.12)',
      border: '2px solid rgba(239,68,68,0.5)',
      borderRadius: 12,
      padding: '14px 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontWeight: 700,
      fontSize: 14,
      marginBottom: 4
    }
  }, "\uD83D\uDEA8 HIGH RISK INSTRUMENT WARNING"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FCA5A5',
      fontSize: 13
    }
  }, result.warning)), result && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "COST BREAKDOWN"), [{
    label: 'Spread Cost',
    value: formatCurrency(result.spreadCost),
    sub: `${result.spread} pips × $${result.pipValue}/pip × ${lotSize} lots`,
    color: '#F87171'
  }, {
    label: 'Commission (est.)',
    value: formatCurrency(result.commission),
    sub: '$2.00/lot round-trip (industry standard)',
    color: '#FBBF24'
  }, {
    label: '───────────────',
    value: '',
    sub: '',
    color: 'transparent'
  }, {
    label: 'TOTAL ENTRY COST',
    value: formatCurrency(result.totalEntryCost),
    sub: 'To break even, price must move this far',
    color: '#F87171',
    bold: true
  }].map((r, i) => r.label.startsWith('─') ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderTop: '1px solid #1E293B',
      margin: '8px 0'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: r.bold ? '#E2E8F0' : '#94A3B8',
      fontWeight: r.bold ? 700 : 400,
      fontSize: r.bold ? 14 : 13
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#334155',
      fontSize: 11
    }
  }, r.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: r.color,
      fontWeight: r.bold ? 800 : 700,
      fontSize: r.bold ? 20 : 14
    }
  }, r.value)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1
    }
  }, "DAILY LIMIT IMPACT"), /*#__PURE__*/React.createElement("span", {
    className: `badge ${result.riskLevel === 'HIGH' ? 'tag-red' : result.riskLevel === 'MEDIUM' ? 'tag-amber' : 'tag-green'}`
  }, result.riskLevel, " RISK")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 13
    }
  }, "Daily Loss Limit (", ACCOUNT_TYPES[accountType].dailyLimit * 100, "%)"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700
    }
  }, formatCurrency(result.dailyLimitUSD))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 13
    }
  }, "Entry Cost Consumes"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: result.riskLevel === 'HIGH' ? '#F87171' : '#FBBF24',
      fontWeight: 800,
      fontSize: 16
    }
  }, result.pctOfDailyLimit.toFixed(1), "%")), /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-bg",
    style: {
      height: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-bar-fill",
    style: {
      width: Math.min(result.pctOfDailyLimit, 100) + '%',
      background: result.riskLevel === 'HIGH' ? '#EF4444' : result.riskLevel === 'MEDIUM' ? '#F59E0B' : '#10B981'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11,
      marginTop: 8
    }
  }, "Break-even: price must move ", result.breaksEvenAt.toFixed(1), " pips in your favor before you profit"))))));
}

// ============================================================
// F3: RULE ACKNOWLEDGEMENT
// ============================================================
function RuleAcknowledgement() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState([]);
  const acknowledge = ruleId => {
    const rule = rules.find(r => r.id === ruleId);
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r,
      acknowledged: true
    } : r));
    setHistory(prev => [{
      rule: rule.title,
      time: new Date().toLocaleTimeString(),
      ip: '192.168.1.x',
      id: ruleId
    }, ...prev]);
    setModal(null);
  };
  const pending = rules.filter(r => !r.acknowledged);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCCB Rule Acknowledgement Centre"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Every rule change \u2014 timestamped, IP-logged, legally binding \xB7 Solves FundingTicks' fatal mistake")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 12,
      marginBottom: 16
    }
  }, [{
    label: 'PENDING',
    value: pending.length,
    color: pending.length > 0 ? '#F87171' : '#34D399'
  }, {
    label: 'ACKNOWLEDGED',
    value: rules.filter(r => r.acknowledged).length,
    color: '#34D399'
  }, {
    label: 'TOTAL RULES',
    value: rules.length,
    color: '#60A5FA'
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "card-inner",
    style: {
      padding: '14px 16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: s.color,
      fontWeight: 900,
      fontSize: 32,
      margin: '4px 0'
    }
  }, s.value)))), pending.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#FBBF24',
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 10
    }
  }, "\u26A0\uFE0F Requires Your Acknowledgement"), pending.map(rule => /*#__PURE__*/React.createElement("div", {
    key: rule.id,
    className: "glow-amber",
    style: {
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 15
    }
  }, rule.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge tag-amber",
    style: {
      fontSize: 10
    }
  }, rule.category.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 11
    }
  }, "Effective: ", rule.effectiveDate), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#64748B',
      fontSize: 11
    }
  }, "Affects: ", rule.affectedAccounts.join(', ')))), /*#__PURE__*/React.createElement("button", {
    className: "btn-amber",
    style: {
      padding: '8px 16px',
      fontSize: 13
    },
    onClick: () => setModal(rule)
  }, "Review & Acknowledge")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(239,68,68,0.08)',
      borderRadius: 8,
      padding: '10px 12px',
      border: '1px solid rgba(239,68,68,0.2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontSize: 10,
      fontWeight: 700,
      marginBottom: 4
    }
  }, "OLD RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#CBD5E1',
      fontSize: 12,
      lineHeight: 1.6
    }
  }, rule.oldText)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(16,185,129,0.08)',
      borderRadius: 8,
      padding: '10px 12px',
      border: '1px solid rgba(16,185,129,0.2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontSize: 10,
      fontWeight: 700,
      marginBottom: 4
    }
  }, "NEW RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#CBD5E1',
      fontSize: 12,
      lineHeight: 1.6
    }
  }, rule.newText)))))), rules.filter(r => r.acknowledged).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "ACKNOWLEDGED RULES"), rules.filter(r => r.acknowledged).map(rule => /*#__PURE__*/React.createElement("div", {
    key: rule.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#E2E8F0',
      fontSize: 13,
      fontWeight: 600
    }
  }, rule.title), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11,
      marginTop: 2
    }
  }, "Effective: ", rule.effectiveDate, " \xB7 ", rule.affectedAccounts.join(', '))), /*#__PURE__*/React.createElement("span", {
    className: "badge tag-green",
    style: {
      fontSize: 11
    }
  }, "\u2713 ACKNOWLEDGED")))), history.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "AUDIT LOG"), history.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      padding: '8px 0',
      borderBottom: '1px solid #1E293B',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#34D399'
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#CBD5E1',
      flex: 1
    }
  }, h.rule), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569'
    }
  }, h.time), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontFamily: 'monospace'
    }
  }, "IP: ", h.ip)))), modal && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setModal(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-box",
    style: {
      padding: 28
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 18,
      marginBottom: 4
    }
  }, modal.title), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 12,
      marginBottom: 20
    }
  }, "Effective ", modal.effectiveDate, " \xB7 Affects: ", modal.affectedAccounts.join(', ')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: 14,
      border: '1px solid rgba(239,68,68,0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 6
    }
  }, "PREVIOUS RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#CBD5E1',
      fontSize: 13,
      lineHeight: 1.7
    }
  }, modal.oldText)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: 14,
      border: '1px solid rgba(16,185,129,0.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 6
    }
  }, "NEW RULE"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#CBD5E1',
      fontSize: 13,
      lineHeight: 1.7
    }
  }, modal.newText))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      fontSize: 12,
      color: '#64748B',
      border: '1px solid #1E293B'
    }
  }, "By clicking Acknowledge, you confirm you have read and understood this rule change. This action will be logged with your account ID, timestamp, and IP address as proof of notification."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      flex: 1,
      padding: 12,
      fontSize: 14
    },
    onClick: () => acknowledge(modal.id)
  }, "\u2713 I Acknowledge This Rule Change"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setModal(null),
    style: {
      padding: '12px 20px',
      background: '#1E293B',
      border: 'none',
      color: '#94A3B8',
      borderRadius: 8,
      cursor: 'pointer',
      fontSize: 14
    }
  }, "Cancel")))));
}

// ============================================================
// AI COACH (Knowledge Work Plugins Integration)
// ============================================================
function AICoach() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const simulate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2200);
  };
  const insights = [{
    icon: '📉',
    title: 'Overtrade Pattern Detected',
    severity: 'HIGH',
    desc: 'You placed 5 trades on Feb 19 (your only losing day). Your average trades on losing days is 4.8 vs 2.5 on winning days. Stop trading after 2 consecutive losses.',
    action: 'Set a max 3-trade daily limit'
  }, {
    icon: '⚡',
    title: 'Best Performance: London Open',
    severity: 'MEDIUM',
    desc: '73% of your profitable trades occur 07:00–10:00 UTC (London Open). Your afternoon trades (13:00–17:00) have a 38% win rate. Focus your energy on London session.',
    action: 'Trade only 07:00–10:00 UTC'
  }, {
    icon: '⚠️',
    title: 'XAG/USD Position Sizing Risk',
    severity: 'HIGH',
    desc: 'You traded XAG 3 times this cycle. The $50/pip value means you are taking on 5x more spread risk than EURUSD. Two of these trades cost $175+ in entry costs alone.',
    action: 'Avoid XAG until fully funded'
  }, {
    icon: '🎯',
    title: 'Consistency Cap Approaching',
    severity: 'CRITICAL',
    desc: `Your Feb 20 profit ($1,500) is now ${(1500 / 3780 * 100).toFixed(1)}% of total cycle profit — exceeding your 35% on-demand cap. You cannot request an on-demand payout right now.`,
    action: 'Switch to bi-weekly payout type'
  }];
  const severityColors = {
    CRITICAL: '#F87171',
    HIGH: '#FBBF24',
    MEDIUM: '#60A5FA',
    LOW: '#34D399'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83E\uDD16 AI Trade Coach"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Powered by Knowledge Work Plugins (Customer Support + Data + Productivity)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 12,
      marginBottom: 20
    }
  }, [{
    label: 'COACHING SCORE',
    value: '64/100',
    color: '#FBBF24',
    icon: '🎯'
  }, {
    label: 'WIN RATE',
    value: '58%',
    color: '#34D399',
    icon: '📈'
  }, {
    label: 'PROFIT FACTOR',
    value: '1.82',
    color: '#60A5FA',
    icon: '⚡'
  }, {
    label: 'MAX DRAWDOWN',
    value: '-8.4%',
    color: '#F87171',
    icon: '📉'
  }].map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700
    }
  }, m.label), /*#__PURE__*/React.createElement("span", null, m.icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: m.color,
      fontWeight: 800,
      fontSize: 22,
      margin: '8px 0 2px'
    }
  }, m.value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "AI-IDENTIFIED PATTERNS & RECOMMENDATIONS"), insights.map((ins, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "card",
    style: {
      padding: 16,
      marginBottom: 10,
      borderLeft: `3px solid ${severityColors[ins.severity]}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, ins.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 14
    }
  }, ins.title)), /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: severityColors[ins.severity] + '22',
      color: severityColors[ins.severity],
      border: `1px solid ${severityColors[ins.severity]}44`,
      fontSize: 10
    }
  }, ins.severity)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 13,
      lineHeight: 1.6,
      marginBottom: 8
    }
  }, ins.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#34D399',
      fontSize: 11
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#34D399',
      fontSize: 12,
      fontWeight: 600
    }
  }, "Action: ", ins.action))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 8,
      letterSpacing: 1
    }
  }, "GENERATE IMPROVEMENT PLAN"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginBottom: 14
    }
  }, "Uses the Skills repo (docx skill) to generate a personalized 30-day trading improvement plan based on your performance data"), !generated ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '10px 20px',
      fontSize: 13,
      opacity: generating ? 0.7 : 1
    },
    onClick: simulate,
    disabled: generating
  }, generating ? '⏳ Generating Plan...' : '📄 Generate My Improvement Plan (DOCX)') : /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(16,185,129,0.1)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontWeight: 700,
      fontSize: 13
    }
  }, "\u2713 Improvement Plan Generated"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, "PropEdge_ImprovementPlan_Feb2026.docx \xB7 4 pages")), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    style: {
      padding: '8px 16px',
      fontSize: 12
    }
  }, "Download"))));
}

// ============================================================
// ANALYTICS (Financial Services Plugins Integration)
// ============================================================
function Analytics() {
  const equityCurve = getEquityCurve(MOCK_TRADES);
  const maxEquity = Math.max(...equityCurve.map(e => e.equity));
  const chartW = 560,
    chartH = 100;
  const pts = equityCurve.map((e, i) => {
    const x = i / (equityCurve.length - 1) * chartW;
    const y = chartH - Math.max(0, e.equity / maxEquity) * (chartH - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  const instruments = [{
    pair: 'XAUUSD',
    trades: 8,
    winRate: 75,
    pnl: 2100,
    avgRR: 2.1
  }, {
    pair: 'EURUSD',
    trades: 12,
    winRate: 58,
    pnl: 980,
    avgRR: 1.6
  }, {
    pair: 'USDJPY',
    trades: 6,
    winRate: 67,
    pnl: 560,
    avgRR: 1.8
  }, {
    pair: 'XAGUSD',
    trades: 3,
    winRate: 33,
    pnl: -340,
    avgRR: 0.8
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCCA Advanced Analytics"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Powered by Financial Services Plugins (Sharpe \xB7 Sortino \xB7 Drawdown \xB7 Risk Metrics)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 12,
      marginBottom: 16
    }
  }, [{
    label: 'SHARPE RATIO',
    value: '1.84',
    color: '#34D399',
    sub: 'Good (>1.0)'
  }, {
    label: 'SORTINO RATIO',
    value: '2.31',
    color: '#34D399',
    sub: 'Strong'
  }, {
    label: 'MAX DRAWDOWN',
    value: '-8.4%',
    color: '#F87171',
    sub: 'Within limit'
  }, {
    label: 'WIN RATE',
    value: '58%',
    color: '#60A5FA',
    sub: '14/24 trades'
  }, {
    label: 'PROFIT FACTOR',
    value: '1.82',
    color: '#FBBF24',
    sub: 'Positive edge'
  }].map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "card-inner",
    style: {
      padding: '12px 14px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 0.5
    }
  }, m.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: m.color,
      fontWeight: 800,
      fontSize: 22,
      margin: '6px 0 2px'
    }
  }, m.value), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#334155',
      fontSize: 10
    }
  }, m.sub)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "EQUITY CURVE"), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    viewBox: `0 0 ${chartW} ${chartH + 20}`
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "eqGrad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#3B82F6",
    stopOpacity: "0.4"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#3B82F6",
    stopOpacity: "0.02"
  }))), /*#__PURE__*/React.createElement("polyline", {
    points: pts + ` ${chartW},${chartH} 0,${chartH}`,
    fill: "url(#eqGrad)",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: "#3B82F6",
    strokeWidth: "2"
  }), equityCurve.map((e, i) => {
    const x = i / (equityCurve.length - 1) * chartW;
    const y = chartH - Math.max(0, e.equity / maxEquity) * (chartH - 10) - 5;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: 3,
      fill: "#3B82F6"
    });
  }), equityCurve.map((e, i) => /*#__PURE__*/React.createElement("text", {
    key: i,
    x: i / (equityCurve.length - 1) * chartW,
    y: chartH + 14,
    textAnchor: "middle",
    fill: "#334155",
    fontSize: 8
  }, e.date)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "PERFORMANCE BY INSTRUMENT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
      gap: 0
    }
  }, ['PAIR', 'TRADES', 'WIN RATE', 'P&L', 'AVG R:R'].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700,
      padding: '6px 8px',
      borderBottom: '1px solid #1E293B',
      letterSpacing: 0.5
    }
  }, h)), instruments.map((ins, i) => [ins.pair, ins.trades, ins.winRate + '%', formatCurrency(ins.pnl), ins.avgRR + 'R'].map((v, j) => /*#__PURE__*/React.createElement("div", {
    key: `${i}-${j}`,
    style: {
      color: j === 0 ? '#F1F5F9' : j === 3 ? ins.pnl > 0 ? '#34D399' : '#F87171' : '#94A3B8',
      fontSize: 13,
      fontWeight: j === 0 ? 700 : 400,
      padding: '8px 8px',
      borderBottom: '1px solid #1E293B'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F87171',
      fontSize: 12,
      marginTop: 10
    }
  }, "\u26A0\uFE0F XAG/USD showing negative P&L \u2014 consider avoiding. High spread cost destroys edge.")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "ACCOUNT SCALING PROJECTION (Financial Services Plugin)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 10
    }
  }, [{
    stage: 'Current',
    size: '$25K',
    profit: '$3,780',
    split: '80%'
  }, {
    stage: 'Scale ×2',
    size: '$50K',
    profit: '$7,560',
    split: '85%'
  }, {
    stage: 'Scale ×4',
    size: '$100K',
    profit: '$15,120',
    split: '90%'
  }, {
    stage: 'Max Scale',
    size: '$200K',
    profit: '$30,240',
    split: '100%'
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: i === 0 ? 'rgba(59,130,246,0.1)' : '#162032',
      border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.3)' : '#1E293B'}`,
      borderRadius: 8,
      padding: '12px 14px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10,
      fontWeight: 700,
      marginBottom: 6
    }
  }, s.stage.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 16
    }
  }, s.size), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontSize: 12,
      marginTop: 4
    }
  }, s.profit, "/cycle"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#60A5FA',
      fontSize: 11,
      marginTop: 2
    }
  }, s.split, " split"))))));
}

// ============================================================
// REPORTS (Skills Repo Integration)
// ============================================================
function Reports() {
  const [states, setStates] = useState({});
  const generate = key => {
    setStates(s => ({
      ...s,
      [key]: 'loading'
    }));
    setTimeout(() => setStates(s => ({
      ...s,
      [key]: 'done'
    })), 2000);
  };
  const reports = [{
    key: 'pdf',
    icon: '📄',
    label: 'Monthly Performance Report',
    format: 'PDF',
    size: '~1.2MB',
    skill: 'pdf skill',
    color: '#F87171',
    desc: 'Full monthly overview: P&L, win rate, best/worst trades, consistency analysis, charts. Uses Skills repo pdf skill.'
  }, {
    key: 'xlsx',
    icon: '📊',
    label: 'Trade Journal Export',
    format: 'XLSX',
    size: '~0.4MB',
    skill: 'xlsx skill',
    color: '#34D399',
    desc: 'Complete trade history with formulas: daily P&L, running equity, R:R calculations, instrument breakdown. Uses Skills repo xlsx skill.'
  }, {
    key: 'pptx',
    icon: '📽️',
    label: 'Quarterly Review Deck',
    format: 'PPTX',
    size: '~3.2MB',
    skill: 'pptx skill',
    color: '#60A5FA',
    desc: '12-slide performance presentation: equity curve, stats, AI insights, improvement roadmap. Uses Skills repo pptx skill.'
  }, {
    key: 'docx',
    icon: '📝',
    label: 'Trading Improvement Plan',
    format: 'DOCX',
    size: '~0.8MB',
    skill: 'docx skill',
    color: '#FBBF24',
    desc: 'AI-generated 30-day improvement plan based on your patterns: specific actions, targets, rules to follow. Uses Skills repo docx skill.'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83D\uDCC4 Auto Report Generator"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "Powered by Skills Repo (pdf \xB7 xlsx \xB7 pptx \xB7 docx) + Financial Services Plugins data")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, reports.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.key,
    className: "card",
    style: {
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28
    }
  }, r.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontWeight: 700,
      fontSize: 14
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge",
    style: {
      background: r.color + '22',
      color: r.color,
      border: `1px solid ${r.color}44`,
      fontSize: 10
    }
  }, r.format), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, r.size))))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 12,
      lineHeight: 1.6,
      marginBottom: 14
    }
  }, r.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#060B18',
      borderRadius: 6,
      padding: '6px 10px',
      marginBottom: 12,
      fontSize: 11,
      color: '#334155',
      fontFamily: 'monospace'
    }
  }, "Uses: anthropics/skills \u2192 ", r.skill), states[r.key] === 'done' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'rgba(16,185,129,0.1)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 8,
      padding: '8px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u2713 Ready"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10
    }
  }, "PropEdge_Report_Feb2026.", r.key === 'pptx' ? 'pptx' : r.key)), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    style: {
      padding: '8px 14px',
      fontSize: 12,
      whiteSpace: 'nowrap'
    }
  }, "\u2B07 Download")) : /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '10px 16px',
      fontSize: 13,
      width: '100%',
      opacity: states[r.key] === 'loading' ? 0.7 : 1
    },
    onClick: () => generate(r.key),
    disabled: states[r.key] === 'loading'
  }, states[r.key] === 'loading' ? '⏳ Generating...' : `Generate ${r.format} Report`)))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "ANTHROPIC REPOS INTEGRATION MAP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 12
    }
  }, [{
    repo: 'anthropics/skills',
    color: '#34D399',
    uses: ['pdf skill → Reports & certificates', 'xlsx skill → Trade journal exports', 'pptx skill → Performance decks', 'docx skill → Improvement plans']
  }, {
    repo: 'anthropics/knowledge-work-plugins',
    color: '#60A5FA',
    uses: ['Data plugin → Trade analytics engine', 'Customer Support → AI coaching bot', 'Productivity → Challenge tracker', 'Legal → Rule compliance framework']
  }, {
    repo: 'anthropics/financial-services-plugins',
    color: '#FBBF24',
    uses: ['Risk metrics → Sharpe/Sortino', 'Financial modeling → Scaling projections', 'Spread analysis → Cost calculator', 'Portfolio analytics → Multi-account view']
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: '14px 16px',
      border: `1px solid ${r.color}33`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: r.color,
      fontWeight: 700,
      fontSize: 12,
      marginBottom: 8,
      fontFamily: 'monospace'
    }
  }, r.repo), r.uses.map((u, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    style: {
      color: '#64748B',
      fontSize: 11,
      padding: '3px 0',
      borderBottom: '1px solid #1E293B',
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.color
    }
  }, "\u203A"), u)))))));
}

// ============================================================
// COMMUNITY
// ============================================================
function Community() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      color: '#F1F5F9',
      fontWeight: 800,
      fontSize: 22,
      margin: 0
    }
  }, "\uD83C\uDFC6 Community Leaderboard"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      marginTop: 4
    }
  }, "FundingPips Funded Traders \xB7 This Month \xB7 Powered by Knowledge Work Marketing Plugin")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 14,
      letterSpacing: 1
    }
  }, "TOP FUNDED TRADERS \u2014 FEBRUARY 2026"), MOCK_LEADERBOARD.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 14px',
      background: t.isYou ? 'rgba(59,130,246,0.1)' : '#162032',
      borderRadius: 8,
      marginBottom: 8,
      border: t.isYou ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#1E293B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: 14,
      color: i < 3 ? '#000' : '#64748B'
    }
  }, i < 3 ? ['🥇', '🥈', '🥉'][i] : t.rank), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18
    }
  }, t.country), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: t.isYou ? '#60A5FA' : '#F1F5F9',
      fontWeight: t.isYou ? 800 : 600,
      fontSize: 14
    }
  }, t.name, " ", t.isYou && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#60A5FA',
      fontSize: 11
    }
  }, "(You)")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, "Win Rate: ", t.winRate, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontWeight: 800,
      fontSize: 16
    }
  }, formatCurrency(t.profit)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, "This cycle"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "YOUR BADGES"), [{
    emoji: '🎯',
    name: 'First Payout',
    desc: 'Received your first payout',
    earned: true
  }, {
    emoji: '📅',
    name: '10-Day Streak',
    desc: 'Traded 10 days consecutively',
    earned: true
  }, {
    emoji: '💰',
    name: 'Gold Trader',
    desc: 'Reached $5K in a single cycle',
    earned: false
  }, {
    emoji: '🏆',
    name: 'Top 10 Ranked',
    desc: 'Reached top 10 leaderboard',
    earned: false
  }].map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 0',
      opacity: b.earned ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, b.emoji), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#F1F5F9',
      fontSize: 13,
      fontWeight: 600
    }
  }, b.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11
    }
  }, b.desc)), b.earned && /*#__PURE__*/React.createElement("span", {
    className: "badge tag-green",
    style: {
      marginLeft: 'auto',
      fontSize: 10
    }
  }, "EARNED")))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 12,
      letterSpacing: 1
    }
  }, "REFERRAL PROGRAM"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#64748B',
      fontSize: 13,
      lineHeight: 1.7,
      marginBottom: 14
    }
  }, "Refer traders to FundingPips and earn 10% of their first challenge fee. Powered by Knowledge Work Sales Plugin."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 12,
      border: '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 11,
      marginBottom: 4
    }
  }, "YOUR REFERRAL LINK"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#60A5FA',
      fontSize: 12,
      fontFamily: 'monospace'
    }
  }, "fundingpips.com/ref/PE-SHIN-42")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [{
    label: 'Referrals',
    value: '3'
  }, {
    label: 'Earned',
    value: '$187'
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: '#162032',
      borderRadius: 8,
      padding: '10px 12px',
      textAlign: 'center',
      border: '1px solid #1E293B'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#475569',
      fontSize: 10
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#34D399',
      fontWeight: 800,
      fontSize: 18
    }
  }, s.value)))))));
}

// ============================================================
// MAIN APP
// ============================================================
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotification({
        type: 'warning',
        msg: '⚠️ NFP in 30 minutes — restricted window approaching'
      });
      setTimeout(() => setNotification(null), 5000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return /*#__PURE__*/React.createElement(Dashboard, {
          setActiveTab: setActiveTab
        });
      case 'news':
        return /*#__PURE__*/React.createElement(NewsMonitor, null);
      case 'consistency':
        return /*#__PURE__*/React.createElement(ConsistencyCalculator, null);
      case 'cost':
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
        return /*#__PURE__*/React.createElement(Dashboard, {
          setActiveTab: setActiveTab
        });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      background: '#060B18',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflowY: 'auto',
      minHeight: '100vh'
    }
  }, renderTab()), notification && /*#__PURE__*/React.createElement("div", {
    className: "notification"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: notification.type === 'warning' ? '#92400E' : '#1E40AF',
      border: `1px solid ${notification.type === 'warning' ? '#F59E0B' : '#3B82F6'}`,
      borderRadius: 10,
      padding: '12px 18px',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      maxWidth: 340,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
    }
  }, notification.msg)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));