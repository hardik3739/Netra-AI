import React, { useEffect, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, ResponsiveContainer } from 'recharts';
import CanaraBranchesMap from '../components/CanaraBranchesMap';

export default function DashboardPage({ apiBase }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [belowCount, setBelowCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [branchMaps, setBranchMaps] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/regpilot/compliance-history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.map(d => ({ date: d.date, compliance_score: d.compliance_score, events_count: d.events_count, total_maps: d.total_maps, completed_maps: d.completed_maps, open_maps: d.open_maps })));
          const below = data.filter(d => d.compliance_score < 80).length;
          setBelowCount(below);
        }
      } catch (e) {
        console.error('Failed to load compliance history', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await fetch(`${apiBase}/regpilot/branches`);
        if (res.ok) {
          const j = await res.json();
          setBranches(j.branches || []);
        }
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    };
    loadBranches();
  }, [apiBase]);

  const toggleExpand = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!branchMaps[id]) {
      try {
        const res = await fetch(`${apiBase}/regpilot/branches/${id}/maps`);
        if (res.ok) {
          const j = await res.json();
          setBranchMaps(prev => ({ ...prev, [id]: j.maps || [] }));
        } else {
          setBranchMaps(prev => ({ ...prev, [id]: [] }));
        }
      } catch (e) {
        console.error('Failed to load branch maps', e);
        setBranchMaps(prev => ({ ...prev, [id]: [] }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-[Space Grotesk] text-xl font-black uppercase">COMPLIANCE TREND — LAST 30 DAYS</h3>
            <p className="font-mono text-xs text-gray-600">Daily compliance score tracking with regulatory events</p>
          </div>
          <div>
            <button onClick={async () => {
                try {
                  const r = await fetch(`${apiBase}/regpilot/snapshot`, { method: 'POST' });
                  if (r.ok) {
                    alert('Snapshot recorded for today');
                    // refresh
                    setLoading(true);
                    const resp = await fetch(`${apiBase}/regpilot/compliance-history`);
                    if (resp.ok) {
                      const d = await resp.json();
                      setHistory(d.map(dd => ({ date: dd.date, compliance_score: dd.compliance_score, events_count: dd.events_count, total_maps: dd.total_maps, completed_maps: dd.completed_maps, open_maps: dd.open_maps })));
                      setBelowCount(d.filter(x => x.compliance_score < 80).length);
                    }
                  } else {
                    alert('Snapshot failed');
                  }
                } catch (e) {
                  alert('Snapshot failed');
                } finally {
                  setLoading(false);
                }
              }} className="uppercase border-2 border-black px-3 py-2 font-black [box-shadow:4px_4px_0px_#000] bg-white">📸 TAKE SNAPSHOT</button>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm font-black">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => {
                  try { const dt = new Date(d); return dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }); } catch (e) { return d; }
                }} />
                <YAxis domain={[0,100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} labelFormatter={(lbl) => {
                  try { const dt = new Date(lbl); return dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return lbl; }
                }} />
                <ReferenceLine y={80} stroke="#FF9500" strokeDasharray="6 6" label={{ value: '80% TARGET', position: 'top', fill: '#FF9500' }} />

                {/* area under curve */}
                <Area type="monotone" dataKey="compliance_score" stroke="#534AB7" fill="#E4E4FF" />

                {/* purple line for full series */}
                <Line type="monotone" dataKey="compliance_score" stroke="#534AB7" strokeWidth={3} dot={{ r: 4, fill: '#534AB7' }} />

                {/* red segments for below-threshold points */}
                <Line type="monotone" dataKey={(d) => (d.compliance_score < 80 ? d.compliance_score : null)} stroke="#FF3B3B" strokeWidth={3} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {belowCount > 0 && (
          <div className="mt-3 border-2 border-black bg-[#fff4e5] p-3 font-bold">⚠ Compliance dropped below 80% minimum target on {belowCount} occasions</div>
        )}

        {/* Trend and stats */}
        {!loading && history && history.length > 0 && (
          (() => {
            const first = history[0].compliance_score;
            const last = history[history.length - 1].compliance_score;
            const improving = last > first;
            const best = Math.max(...history.map(h => h.compliance_score));
            const worst = Math.min(...history.map(h => h.compliance_score));
            return (
              <div className="mt-4 flex items-center gap-4">
                <div className={`px-3 py-2 border-2 border-black font-black ${improving ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{improving ? '↑ IMPROVING' : '↓ DECLINING'}</div>
                <div className="px-3 py-2 border-2 border-black">Best: <strong>{best}%</strong></div>
                <div className="px-3 py-2 border-2 border-black">Worst: <strong>{worst}%</strong></div>
              </div>
            );
          })()
        )}
      </div>
      {/* Branch Network Compliance Map Section */}
      <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a]">
        <h3 className="font-[Space Grotesk] text-xl font-black uppercase">BRANCH NETWORK COMPLIANCE MAP</h3>
        <p className="font-mono text-xs text-gray-600">Real-time compliance status across all Canara Bank branches</p>

        <div className="mt-4">
          <CanaraBranchesMap branches={branches} />
        </div>

        <div className="mt-4">
          <h4 className="font-bold mb-2">Branch Comparison</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">BRANCH</th>
                  <th className="p-2">CITY</th>
                  <th className="p-2">REGION</th>
                  <th className="p-2">COMPLIANCE SCORE</th>
                  <th className="p-2">STATUS</th>
                  <th className="p-2">OPEN MAPs</th>
                  <th className="p-2">HIGH PRIORITY</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(b.id)}>
                      <td className="p-2 font-bold">{b.name}</td>
                      <td className="p-2">{b.city}</td>
                      <td className="p-2">{b.region}</td>
                      <td className="p-2 w-56">
                        <div className="bg-gray-200 h-3 rounded overflow-hidden">
                          <div className={`h-3 ${b.compliance_status === 'CRITICAL' ? 'bg-red-600' : b.compliance_status === 'WARNING' ? 'bg-amber-500' : 'bg-green-600'}`} style={{ width: `${b.compliance_score}%` }} />
                        </div>
                        <div className="text-xs mt-1">{b.compliance_score}%</div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${b.compliance_status === 'CRITICAL' ? 'bg-red-100 text-red-700' : b.compliance_status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{b.compliance_status}</span>
                      </td>
                      <td className="p-2">{b.open_maps}</td>
                      <td className="p-2">{b.high_priority_open}</td>
                    </tr>
                    {expanded === b.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-4">
                          <div className="text-sm">{branchMaps[b.id] ? (
                            <ul className="list-disc pl-5">
                              {branchMaps[b.id].map(m => (
                                <li key={m.id} className="py-1">{m.title} — <span className="font-mono text-xs">{m.department}</span> — <strong>{m.status}</strong></li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-xs text-gray-500">Loading maps...</div>
                          )}</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

