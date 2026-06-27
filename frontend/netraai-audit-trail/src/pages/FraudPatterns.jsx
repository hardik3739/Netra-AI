import { useState, useEffect } from "react";

export default function FraudPatterns({ apiBase }) {
  const [patterns, setPatterns] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/forgeshield/patterns`);
        if (res.ok) {
          const data = await res.json();
          setPatterns(data || []);
        }
      } catch (e) {
        console.error("Failed to load fraud patterns", e);
      }
    };
    load();
  }, [apiBase]);

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-[2.5px] border-[#1a1a1a] [box-shadow:6px_6px_0px_#000000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">FRAUD PATTERN LIBRARY</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-0.5">Known document fraud techniques in Indian banking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns.map((p) => (
          <div key={p.id} className="bg-white border-[2.5px] border-black shadow-[6px_6px_0px_#000000] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-black border-2 border-black px-2 py-0.5">{p.id}</span>
                <h3 className="font-[Space Grotesk] font-black uppercase text-lg">{p.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border-2 border-black font-mono text-xs font-black ${p.severity === 'CRITICAL' ? 'bg-[#e63b2e] text-white' : p.severity === 'HIGH' ? 'bg-[#ff9900] text-black' : 'bg-[#ffcc00] text-black'}`}>{p.severity}</span>
                <span className="px-2 py-0.5 border-2 border-black font-mono text-xs font-black bg-black text-white">{p.frequency}</span>
              </div>
            </div>

            <p className="mb-2">{p.description}</p>

            <div className="mb-2 border-l-4 border-purple-600 pl-3 py-2">
              <strong>India Impact:</strong>
              <div className="font-mono text-sm">{p.india_impact}</div>
            </div>

            <div className="mb-2 font-mono text-sm border-2 border-black p-2">
              <strong>Legal:</strong>
              <div className="mt-1">{p.legal_reference}</div>
            </div>

            <div className="mb-2">
              <strong>Detection Indicators:</strong>
              <ul className="list-disc ml-5 mt-1">
                {p.detection_indicators.map((d, i) => <li key={i} className="font-mono text-sm">{d}</li>)}
              </ul>
            </div>

            <div className="bg-green-100 border-2 border-black p-3 font-mono font-bold">Recommended Action: {p.recommended_action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
