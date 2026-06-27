import React, { useState } from 'react';

export default function LoanDossier({ apiBase, onAddLog }) {
  const [step, setStep] = useState(1);
  const [applicantName, setApplicantName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('home');
  const [dossierId, setDossierId] = useState(null);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const createDossier = async () => {
    const body = { applicant_name: applicantName, loan_amount: parseFloat(loanAmount), loan_type: loanType };
    const res = await fetch(`${apiBase}/dossier/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const j = await res.json();
      setDossierId(j.dossier_id);
      setStep(2);
    }
  };

  const handleFileChange = (slot, e) => {
    const f = e.target.files[0];
    setFiles(prev => ({ ...prev, [slot]: f }));
  };

  const analyseAll = async () => {
    if (!dossierId) return;
    setLoading(true);
    const form = new FormData();
    const order = [];
    Object.keys(files).forEach(k => {
      if (files[k]) { form.append('files', files[k]); order.push(k); }
    });
    form.append('doc_types', order.join(','));
    try {
      const res = await fetch(`${apiBase}/dossier/${dossierId}/upload`, { method: 'POST', body: form });
      if (res.ok) {
        const j = await res.json();
        setResult(j);
        setStep(3);
        onAddLog({ vector: 'DOSSIER', vectorCategory: 'API', entityHash: `DOS-${dossierId.substring(0,8)}`, payload: `Dossier analysed ${dossierId}` });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* Step 1 */}
        {step === 1 && (
          <div className="border-4 border-black p-6 [box-shadow:6px_6px_0px_#000] font-[Space Grotesk]">
            <h2 className="text-2xl font-black uppercase mb-3">Loan Dossier — Application Details</h2>
            <label className="block mb-2">Applicant Name</label>
            <input className="w-full p-2 border-2 border-black mb-3" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
            <label className="block mb-2">Loan Amount (₹)</label>
            <input type="number" className="w-full p-2 border-2 border-black mb-3" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
            <label className="block mb-2">Loan Type</label>
            <select className="w-full p-2 border-2 border-black mb-4" value={loanType} onChange={e => setLoanType(e.target.value)}>
              <option value="home">Home Loan</option>
              <option value="personal">Personal Loan</option>
              <option value="business">Business Loan</option>
              <option value="agricultural">Agricultural Loan</option>
            </select>
            <button className="bg-white border-4 border-black px-4 py-2 font-black" onClick={createDossier}>CREATE DOSSIER</button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="border-4 border-black p-6 [box-shadow:6px_6px_0px_#000] font-[Space Grotesk]">
            <h2 className="text-2xl font-black uppercase mb-3">Document Upload — Dossier: {dossierId}</h2>
            {[
              ['salary_slip', 'Salary Slip'],
              ['bank_statement', 'Bank Statement (Last 6 months)'],
              ['land_record', 'Land Record / Property Document'],
              ['company_letter', 'Company Letter / Employment Proof'],
              ['additional', 'Additional Document (optional)']
            ].map(([key, label]) => (
              <div key={key} className="mb-3">
                <label className="block mb-1">{label}</label>
                <input type="file" onChange={e => handleFileChange(key, e)} />
                <div className="text-sm mt-1">{files[key] ? files[key].name : 'No file selected'}</div>
              </div>
            ))}

            <button className="bg-white border-4 border-black px-4 py-2 font-black mr-3" onClick={analyseAll} disabled={loading}>{loading ? 'Running 3-layer AI analysis on each document...' : 'ANALYSE ALL DOCUMENTS'}</button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && result && (
          <div className="border-4 border-black p-6 [box-shadow:6px_6px_0px_#000] font-[Space Grotesk]">
            <h2 className="text-2xl font-black uppercase mb-3">Dossier Results</h2>
            <div className="p-4 border-2 mb-3">
              <div className="text-xl font-black">Overall Risk: {result.overall_risk_score}</div>
              <div className="mt-2">Recommendation: {result.recommendation}</div>
            </div>

            <div className="mb-3">
              <h3 className="font-black">Cross-document Flags</h3>
              {result.cross_flags && result.cross_flags.length > 0 ? result.cross_flags.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-yellow-800">⚠ {f}</div>
              )) : <div>None</div>}
            </div>

            <div>
              <h3 className="font-black mb-2">Per-document breakdown</h3>
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="border-b-2 border-black"><th className="p-2">Doc Type</th><th>Filename</th><th>Risk</th><th>Verdict</th><th>Flags</th></tr>
                </thead>
                <tbody>
                  {result.documents.map((d) => (
                    <tr key={d.id} className="border-t-2 border-black">
                      <td className="p-2">{d.doc_type}</td>
                      <td>{d.filename}</td>
                      <td>{d.risk_score}</td>
                      <td>{d.verdict}</td>
                      <td>{d.nlp_flags && d.nlp_flags.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
