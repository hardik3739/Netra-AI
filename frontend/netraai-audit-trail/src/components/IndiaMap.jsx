import React, { useState } from 'react';

export default function IndiaMap({ branches = [], width = 900, height = 360 }) {
  const [hover, setHover] = useState(null);

  if (!branches || branches.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-sm text-gray-500">No branch data</div>
    );
  }

  // compute simple bounds for linear mapping
  const lats = branches.map(b => b.lat);
  const lngs = branches.map(b => b.lng);
  const minLat = Math.min(...lats) - 1;
  const maxLat = Math.max(...lats) + 1;
  const minLng = Math.min(...lngs) - 1;
  const maxLng = Math.max(...lngs) + 1;

  const toXY = (lat, lng) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * (width - 40) + 20; // padding
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * (height - 40) + 20;
    return [x, y];
  };

  const getColor = (status) => {
    if (status === 'CRITICAL') return '#e53e3e';
    if (status === 'WARNING') return '#f6ad55';
    return '#38a169';
  };

  return (
    <div className="p-4 bg-[#F5F5F5] border-2 border-black shadow-lg" style={{ maxWidth: width }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <filter id="hardshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="3" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
          </filter>
          <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }`}</style>
        </defs>

        {/* Simple polygon representing India boundary (approx) */}
        <rect x="0" y="0" width={width} height={height} fill="#F5F5F5" stroke="#000" strokeWidth="2.5" filter="url(#hardshadow)" />

        {branches.map((b) => {
          const [x, y] = toXY(b.lat, b.lng);
          const color = getColor(b.compliance_status);
          const isCritical = b.compliance_status === 'CRITICAL';
          return (
            <g key={b.id} transform={`translate(${x}, ${y})`}>
              <circle
                cx={0}
                cy={0}
                r={7}
                fill={color}
                stroke="#000"
                strokeWidth={2}
                style={isCritical ? { animation: 'pulse 1.6s infinite' } : {}}
                onMouseEnter={() => setHover(b)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {/* Tooltip rendered in SVG via foreignObject */}
        {hover && (
          <foreignObject x={20} y={20} width={260} height={100}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="bg-white border p-2 text-xs shadow">
              <div className="font-bold">{hover.name}</div>
              <div className="text-[11px]">{hover.city} — {hover.region}</div>
              <div className="mt-1">Score: <span className="font-mono">{hover.compliance_score}%</span></div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
