import React from 'react';

const SimpleBarChart = ({ data, height = 200, barColor = '#10b981' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 40; // Reserve space for labels

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end justify-between h-full gap-1 px-2">
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 group"
            >
              {/* Bar */}
              <div className="w-full flex flex-col items-center justify-end" style={{ height: `${chartHeight}px` }}>
                <div
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80 relative"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: barColor,
                    minHeight: item.value > 0 ? '4px' : '0'
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {item.value}
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="text-xs text-gray-600 mt-1 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;
