import React, { useState, useEffect, createContext, useContext } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Search, Sun, Moon, RefreshCw } from 'lucide-react';

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  
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

  const fetchStockData = async (sym) => {
    setLoading(true);
    setError(null);
    
    try {
      // Demo data generator for showcase (replace with actual API in production)
      const generateDemoData = () => {
        const basePrice = 150 + Math.random() * 50;
        const dataPoints = {
          '1D': 24,
          '1W': 7,
          '1M': 30,
          '1Y': 12
        };
        
        const points = dataPoints[timeframe] || 24;
        const data = [];
        
        for (let i = 0; i < points; i++) {
          const variance = (Math.random() - 0.5) * 10;
          const price = basePrice + variance + (i * 0.5);
          data.push({
            time: timeframe === '1D' ? `${i}:00` : 
                  timeframe === '1W' ? `Day ${i + 1}` :
                  timeframe === '1M' ? `Day ${i + 1}` :
                  `Month ${i + 1}`,
            price: parseFloat(price.toFixed(2)),
            volume: Math.floor(Math.random() * 1000000)
          });
        }
        
        return {
          symbol: sym,
          currentPrice: data[data.length - 1].price,
          previousClose: data[0].price,
          change: data[data.length - 1].price - data[0].price,
          changePercent: ((data[data.length - 1].price - data[0].price) / data[0].price * 100),
          high: Math.max(...data.map(d => d.price)),
          low: Math.min(...data.map(d => d.price)),
          volume: data.reduce((sum, d) => sum + d.volume, 0),
          chartData: data
        };
      };
      
      const data = generateDemoData();
      setStockData(data);
    } catch (err) {
      setError('Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
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
    <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              MarketView
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter symbol..."
                className={`px-4 py-2 rounded-l-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                onClick={handleSearch}
                className={`px-4 py-2 rounded-r-lg ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
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
            >
              <RefreshCw className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-700'} ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
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
  const { stockData, loading } = useStock();

  if (loading || !stockData) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`}></div>
          <div className={`h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {stockData.symbol}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Real-time Quote
          </p>
        </div>
        {isPositive ? (
          <TrendingUp className="w-10 h-10 text-green-500" />
        ) : (
          <TrendingDown className="w-10 h-10 text-red-500" />
        )}
      </div>

      <div className="mb-6">
        <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          ${stockData.currentPrice.toFixed(2)}
        </div>
        <div className={`flex items-center space-x-2 text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{isPositive ? '+' : ''}{stockData.change.toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>High</p>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.high.toFixed(2)}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Low</p>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.low.toFixed(2)}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Prev Close</p>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ${stockData.previousClose.toFixed(2)}
          </p>
        </div>
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Volume</p>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
  const timeframes = ['1D', '1W', '1M', '1Y'];

  return (
    <div className="flex space-x-2">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => setTimeframe(tf)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            timeframe === tf
              ? isDark
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500 text-white'
              : isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {tf}
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
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
        <div className="animate-pulse">
          <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Price Chart
        </h3>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#ffffff' : '#000000'
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
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
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <StockOverview />
          <PriceChart />
        </div>
      </main>

      <footer className={`${isDark ? 'bg-gray-800' : 'bg-white'} mt-12 py-6`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            MarketView - Real-Time Stock Analysis Dashboard
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
            Demo data shown. Replace with Alpha Vantage API for production.
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