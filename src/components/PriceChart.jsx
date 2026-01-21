import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PriceChart = ({ priceHistory, currentPrice }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Filter data based on time range
  const getFilteredData = () => {
    if (!priceHistory || priceHistory.length === 0) return [];

    const now = new Date();
    let daysBack;

    switch (timeRange) {
      case '7d':
        daysBack = 7;
        break;
      case '30d':
        daysBack = 30;
        break;
      case '90d':
        daysBack = 90;
        break;
      default:
        daysBack = 30;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return priceHistory
      .filter(item => new Date(item.date) >= cutoffDate)
      .map(item => ({
        ...item,
        displayDate: formatDate(item.date, timeRange)
      }));
  };

  const formatDate = (dateStr, range) => {
    const date = new Date(dateStr);

    if (range === '7d') {
      // Show day name for 7-day view
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (range === '30d') {
      // Show month/day for 30-day view
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // Show month/day for 90-day view
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const data = getFilteredData();

  // Calculate price change
  const calculateChange = () => {
    if (data.length < 2) return { percent: 0, amount: 0, isPositive: true };

    const oldPrice = data[0].price;
    const newPrice = data[data.length - 1].price;
    const change = newPrice - oldPrice;
    const percent = ((change / oldPrice) * 100).toFixed(2);

    return {
      percent: Math.abs(percent),
      amount: Math.abs(change).toFixed(2),
      isPositive: change >= 0
    };
  };

  const change = calculateChange();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip border rounded-lg p-3 shadow-xl">
          <p className="text-xs chart-tooltip-label mb-1">{payload[0].payload.displayDate}</p>
          <p className="text-lg font-bold chart-tooltip-value">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate min/max for Y axis with proper bounds
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range > 0 ? range * 0.15 : maxPrice * 0.1;

  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="text-sm">No price history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'chart-button-active'
                  : 'chart-button-inactive'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Price Change Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          change.isPositive
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {change.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {change.isPositive ? '+' : '-'}${change.amount} ({change.percent}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={change.isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={change.isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
              stroke="#475569"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#475569"
              style={{ fontSize: '12px' }}
              tickLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              domain={[
                Math.max(0, minPrice - padding),
                maxPrice + padding
              ]}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={change.isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="chart-stat-box rounded-lg p-3">
          <p className="text-xs chart-stat-label mb-1">Current</p>
          <p className="text-sm font-semibold chart-stat-value">
            ${currentPrice?.toFixed(2) || 'N/A'}
          </p>
        </div>
        <div className="chart-stat-box rounded-lg p-3">
          <p className="text-xs chart-stat-label mb-1">High ({timeRange})</p>
          <p className="text-sm font-semibold text-green-400">
            ${maxPrice.toFixed(2)}
          </p>
        </div>
        <div className="chart-stat-box rounded-lg p-3">
          <p className="text-xs chart-stat-label mb-1">Low ({timeRange})</p>
          <p className="text-sm font-semibold text-red-400">
            ${minPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="p-3 chart-insight-box rounded-lg border">
        <p className="text-xs chart-insight-text">
          {change.isPositive ? (
            <>
              📈 Price has <span className="text-green-400 font-semibold">increased</span> by ${change.amount} ({change.percent}%) over the last {timeRange}
            </>
          ) : (
            <>
              📉 Price has <span className="text-red-400 font-semibold">decreased</span> by ${change.amount} ({change.percent}%) over the last {timeRange}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default PriceChart;
