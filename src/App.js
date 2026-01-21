import React, { useState, useEffect, createContext, useContext } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Search, Sun, Moon, RefreshCw, AlertCircle } from 'lucide-react';

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  
  const toggleTheme = () => setIsDark(!isDark);
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// Stock Data Context
const StockContext = createContext();

const StockProvider = ({ children }) => {
  const [stockData, setStockData] = useState(null);
  const [symbol, setSymbol] = useState('IBM');
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Replace with your Alpha Vantage API key
  const API_KEY = 'MFE4BRCPAOKSTB86'; // Get your free key from https://www.alphavantage.co/support/#api-key

  const fetchStockData = async (sym) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch quote data
      const quoteResponse = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${API_KEY}`
      );
      const quoteData = await quoteResponse.json();
      
      if (quoteData['Error Message'] || quoteData['Note']) {
        throw new Error('API limit reached or invalid symbol. Using demo data.');
      }
      
      const quote = quoteData['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('No data found for this symbol');
      }
      
      // Fetch intraday data for chart
      let chartData = [];
      const timeFunction = {
        '1D': 'TIME_SERIES_INTRADAY',
        '1W': 'TIME_SERIES_DAILY',
        '1M': 'TIME_SERIES_DAILY',
        '1Y': 'TIME_SERIES_MONTHLY'
      };
      
      const interval = timeframe === '1D' ? '&interval=60min' : '';
      
      const timeSeriesResponse = await fetch(
        `https://www.alphavantage.co/query?function=${timeFunction[timeframe]}&symbol=${sym}${interval}&apikey=${API_KEY}`
      );
      const timeSeriesData = await timeSeriesResponse.json();
      
      // Parse time series data
      const timeSeriesKey = Object.keys(timeSeriesData).find(key => key.includes('Time Series'));
      const timeSeries = timeSeriesData[timeSeriesKey] || {};
      
      const entries = Object.entries(timeSeries).slice(0, 30).reverse();
      
      chartData = entries.map(([time, values]) => ({
        time: new Date(time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          month: 'short',
          day: 'numeric'
        }),
        price: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }));
      
      const currentPrice = parseFloat(quote['05. price']);
      const previousClose = parseFloat(quote['08. previous close']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
      
      setStockData({
        symbol: sym,
        currentPrice,
        previousClose,
        change,
        changePercent,
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        chartData: chartData.length > 0 ? chartData : generateDemoChart()
      });
      
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
      // Fallback to demo data
      setStockData(generateDemoData(sym));
    } finally {
      setLoading(false);
    }
  };
  
  const generateDemoChart = () => {
    const data = [];
    const basePrice = 150;
    for (let i = 0; i < 24; i++) {
      const variance = (Math.random() - 0.5) * 10;
      data.push({
        time: `${i}:00`,
        price: parseFloat((basePrice + variance + (i * 0.5)).toFixed(2)),
        volume: Math.floor(Math.random() * 1000000)
      });
    }
    return data;
  };
  
  const generateDemoData = (sym) => {
    const chartData = generateDemoChart();
    const currentPrice = chartData[chartData.length - 1].price;
    const previousClose = chartData[0].price;
    
    return {
      symbol: sym,
      currentPrice,
      previousClose,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose * 100),
      high: Math.max(...chartData.map(d => d.price)),
      low: Math.min(...chartData.map(d => d.price)),
      volume: chartData.reduce((sum, d) => sum + d.volume, 0),
      chartData
    };
  };

  useEffect(() => {
    fetchStockData(symbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  return (
    <StockContext.Provider value={{ 
      stockData, 
      symbol, 
      setSymbol, 
      timeframe, 
      setTimeframe, 
      loading, 
      error,
      refreshData: () => fetchStockData(symbol)
    }}>
      {children}
    </StockContext.Provider>
  );
};

const useStock = () => useContext(StockContext);

// Components
const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { symbol, setSymbol, refreshData, loading } = useStock();
  const [searchInput, setSearchInput] = useState(symbol);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-95`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MarketView
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Real-time Stock Analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search symbol..."
                className={`px-4 py-2 w-40 sm:w-48 ${
                  isDark 
                    ? 'bg-gray-700 text-white placeholder-gray-400' 
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                } focus:outline-none`}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={refreshData}
              disabled={loading}
              className={`p-2 rounded-lg ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'} ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const StockOverview = () => {
  const { isDark } = useTheme();
  const { stockData, loading, error } = useStock();

  if (loading || !stockData) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`}></div>
          <div className={`h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {error && (
        <div className="mb-4 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-sm text-yellow-500">{error}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stockData.symbol}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isPositive 
                ? 'bg-green-500 bg-opacity-20 text-green-500' 
                : 'bg-red-500 bg-opacity-20 text-red-500'
            }`}>
              {isPositive ? 'UP' : 'DOWN'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Real-time Quote • Last Updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className={`p-4 rounded-full ${isPositive ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10'}`}>
          {isPositive ? (
            <TrendingUp className="w-10 h-10 text-green-500" />
          ) : (
            <TrendingDown className="w-10 h-10 text-red-500" />
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
          ${stockData.currentPrice.toFixed(2)}
        </div>
        <div className={`flex items-center space-x-3 text-xl font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{isPositive ? '+' : ''}{stockData.change.toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
          <span className="text-sm font-normal">Today</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Day High</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.high.toFixed(2)}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Day Low</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.low.toFixed(2)}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Prev Close</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.previousClose.toFixed(2)}
          </p>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Volume</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {(stockData.volume / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>
    </div>
  );
};

const TimeframeSelector = () => {
  const { isDark } = useTheme();
  const { timeframe, setTimeframe } = useStock();
  const timeframes = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '1Y', label: '1 Year' }
  ];

  return (
    <div className="flex space-x-2">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => setTimeframe(tf.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            timeframe === tf.value
              ? isDark
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
};

const PriceChart = () => {
  const { isDark } = useTheme();
  const { stockData, loading } = useStock();

  if (loading || !stockData) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="animate-pulse">
          <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Price Chart
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Historical price movements
          </p>
        </div>
        <TimeframeSelector />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={stockData.chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="time" 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={isDark ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000'
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={3}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const App = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'} transition-colors`}>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <StockOverview />
          <PriceChart />
        </div>
      </main>

      <footer className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mt-12 py-6 border-t`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            MarketView - Real-Time Stock Analysis Dashboard
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
            Powered by Alpha Vantage API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function MarketView() {
  return (
    <ThemeProvider>
      <StockProvider>
        <App />
      </StockProvider>
    </ThemeProvider>
  );
}