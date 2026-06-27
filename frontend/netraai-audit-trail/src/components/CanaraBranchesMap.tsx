import { useState } from 'react';

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string;
  lat: number;
  lng: number;
  compliance_score: number;
  compliance_status: string;
  open_maps: number;
  high_priority_open: number;
}

interface CanaraBranchesMapProps {
  branches: Branch[];
}

// Normalize India coordinates to SVG viewport (0-800 x 0-600)
const normalizeCoords = (lat: number, lng: number) => {
  // India spans roughly 8°E to 97°E and 8°N to 35°N
  const x = ((lng - 68) / 29) * 700 + 50;
  const y = ((35 - lat) / 27) * 500 + 30;
  return { x, y };
};

export default function CanaraBranchesMap({ branches }: CanaraBranchesMapProps) {
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const selectedBranch = branches.find((branch) => branch.id === activeBranchId) || null;

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-black overflow-hidden" style={{ height: '420px' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        {/* India map background (simplified) */}
        <rect width="800" height="600" fill="#e0f2fe" />
        <text x="400" y="30" textAnchor="middle" className="text-sm font-bold" fontSize="16">NETRA AI — Canara Bank Branch Compliance Map (Offline)</text>
        
        {/* Branch markers */}
        {branches.map((branch) => {
          const { x, y } = normalizeCoords(branch.lat, branch.lng);
          const isActive = activeBranchId === branch.id;
          const statusColor = 
            branch.compliance_status === 'CRITICAL' ? '#dc2626' :
            branch.compliance_status === 'WARNING' ? '#f97316' :
            '#16a34a';
          const radius = isActive ? 12 : 8;

          return (
            <g key={branch.id}>
              {/* Marker circle */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={statusColor}
                stroke="#000000"
                strokeWidth="2"
                opacity="0.8"
                className="cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => setActiveBranchId(activeBranchId === branch.id ? null : branch.id)}
              />
              {/* Marker label on hover/active */}
              {isActive && (
                <text
                  x={x}
                  y={y - 20}
                  textAnchor="middle"
                  className="text-xs font-bold pointer-events-none"
                  fontSize="10"
                  fill="#000000"
                >
                  {branch.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Info panel */}
      {selectedBranch && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-3 text-sm">
          <h3 className="font-bold text-sm">{selectedBranch.name}</h3>
          <p className="text-xs text-gray-700">{selectedBranch.city}, {selectedBranch.state}</p>
          <div className="mt-2 text-xs grid grid-cols-2 gap-2">
            <p><strong>Compliance:</strong> {selectedBranch.compliance_score}%</p>
            <p><strong>Status:</strong> {selectedBranch.compliance_status}</p>
            <p><strong>Open MAPs:</strong> {selectedBranch.open_maps}</p>
            <p><strong>Priority:</strong> {selectedBranch.high_priority_open}</p>
          </div>
        </div>
      )}
    </div>
  );
}
