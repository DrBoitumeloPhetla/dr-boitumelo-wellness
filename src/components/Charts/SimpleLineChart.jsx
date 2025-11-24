import React from 'react';

const SimpleLineChart = ({ data, height = 200, lineColor = '#3b82f6', fillColor = 'rgba(59, 130, 246, 0.1)' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const padding = 40;
  const width = 100; // percentage
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue || 1;

  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = ((maxValue - item.value) / valueRange) * chartHeight + padding;
    return { x, y, value: item.value, label: item.label };
  });

  // Create SVG path
  const linePath = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Create filled area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {/* Filled area */}
        <path
          d={areaPath}
          fill={fillColor}
          stroke="none"
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={lineColor}
              className="hover:r-6 transition-all cursor-pointer"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {points.map((point, index) => (
          <div key={index} className="text-xs text-gray-600 text-center" style={{ width: `${100 / points.length}%` }}>
            {point.label}
          </div>
        ))}
      </div>

      {/* Hover tooltips */}
      <div className="absolute inset-0 flex justify-between items-start pointer-events-none">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex-1 h-full group relative"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                 style={{ top: `${point.y}px`, marginTop: '-30px' }}>
              {point.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleLineChart;
