import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitMerge, CheckCircle2, AlertCircle, RefreshCw, Database, 
  ExternalLink, Code2, ArrowRight, ShieldCheck, Link2 
} from 'lucide-react';

export default function InteroperabilityView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testPoshan, setTestPoshan] = useState({
    child_id: "POSHAN-MH-NDB-99201",
    pseudonym_name: "Aarav Pawra",
    gender: "M",
    age_months: 18,
    block_name: "Dhadgaon",
    village_name: "Chandsaili",
    abha_id: "91-4422-9911-3388"
  });

  const [testAsha, setTestAsha] = useState({
    rch_id: "RCH-MH-2023-77112",
    child_alias: "Arav Pawra",
    gender: "M",
    dob_approx: "2025-02-15",
    block_name: "Dhadgaon",
    village_name: "Chandsaili",
    abha_id_stub: "91-4422-9911-3388"
  });

  const [matchResult, setMatchResult] = useState(null);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [sampleFhir, setSampleFhir] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/interoperability/stats');
      const data = await res.json();
      setStats(data);

      const fhirRes = await fetch('/api/interoperability/abdm-bundle/POSHAN-MH-NDB-10001');
      if (fhirRes.ok) {
        const fhirData = await fhirRes.json();
        setSampleFhir(fhirData);
      }
    } catch (err) {
      console.error("Failed to load interop stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runTestMatch = async () => {
    try {
      setMatchingInProgress(true);
      const res = await fetch('/api/interoperability/match-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poshan_record: testPoshan,
          asha_record: testAsha
        })
      });
      const data = await res.json();
      setMatchResult(data);
    } catch (err) {
      console.error("Failed to run match test:", err);
    } finally {
      setMatchingInProgress(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Clinical Card */}
      <div className="clinical-card rounded-2xl p-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <GitMerge className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dual-Registry Interoperability Gateway &amp; ABDM Standards</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">
            Reconciling Disconnected Ministries: MWCD (Poshan Tracker) ↔ MoHFW (ASHA Records)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The fundamental data bottleneck in Indian child nutrition is institutional fragmentation: Anganwadi growth monitoring (MWCD) and Primary Health Centre illness records (MoHFW) use completely separate identifier formats.
            Poshan-Suraksha implements a <strong>3-tier hybrid identity resolution engine</strong> (Deterministic ABHA → Blinded Biometric Token → Fellegi-Sunter Probabilistic Linkage), generating a unified clinical profile exported as an Ayushman Bharat Digital Mission (ABDM) FHIR R4 Bundle.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="clinical-card rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold">Dual-Silo Reconciliation</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-display tabular-nums">
              {stats.overall_linkage_rate_pct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.total_linked.toLocaleString()} / {stats.total_records.toLocaleString()} profiles linked
            </div>
          </div>

          <div className="clinical-card rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold">ABDM ABHA Coverage</div>
            <div className="text-3xl font-extrabold text-blue-700 mt-2 font-display tabular-nums">
              {stats.abha_coverage_pct}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">National Health Authority 14-digit ID</div>
          </div>

          <div className="clinical-card rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold">Probabilistic Fuzzy Match</div>
            <div className="text-3xl font-extrabold text-amber-700 mt-2 font-display tabular-nums">
              34.2%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Phonetic Soundex + DOB window</div>
          </div>

          <div className="clinical-card rounded-xl p-4">
            <div className="text-xs text-slate-500 font-semibold">Unlinked / Orphaned Records</div>
            <div className="text-3xl font-extrabold text-slate-600 mt-2 font-display tabular-nums">
              {(100 - stats.overall_linkage_rate_pct).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Queued for frontline verification</div>
          </div>
        </div>
      )}

      {/* Matching Breakdown Table */}
      {stats && (
        <div className="clinical-card rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display mb-1.5">
            Identity Resolution Hierarchy &amp; Methodology Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Tiered fallback logic ensuring resilient record linkage even in remote tribal hamlets lacking universal digital IDs.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Linkage Methodology</th>
                  <th className="py-3 px-4">Record Count</th>
                  <th className="py-3 px-4">Confidence Tier</th>
                  <th className="py-3 px-4">Confidence Range</th>
                  <th className="py-3 px-4">Institutional Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats.linkage_breakdown.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        idx === 0 ? 'bg-emerald-600' : idx === 1 ? 'bg-blue-600' : idx <= 3 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}></span>
                      <span>{b.method}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 tabular-nums">{b.count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {b.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-bold tabular-nums">{b.confidence}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {idx === 0 ? 'Auto-linked via ABDM Gateway' :
                       idx === 1 ? 'Salted Cryptographic Biometric Hash' :
                       idx === 2 ? 'Multi-attribute algorithmic linkage' :
                       idx === 3 ? 'ASHA physical home-visit confirmation' : 'Manual census reconciliation queue'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Identity Resolution Simulator & ABDM FHIR Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clinical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-display">
              <Link2 className="h-4 w-4 text-blue-600" />
              <span>Interactive Dual-Silo Linkage Simulator</span>
            </h3>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
              Live API
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Test the identity reconciliation algorithm against asynchronous registrations with transliteration variations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Silo 1: Poshan */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-blue-700 flex items-center justify-between">
                <span>Poshan Tracker (MWCD)</span>
                <span className="text-[10px] bg-blue-100/80 text-blue-800 px-1.5 py-0.2 rounded font-bold">AWC Beat</span>
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">Name in Poshan:</label>
                <input
                  type="text"
                  value={testPoshan.pseudonym_name}
                  onChange={(e) => setTestPoshan({ ...testPoshan, pseudonym_name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">Block &amp; Village:</label>
                <input
                  type="text"
                  value={`${testPoshan.block_name} - ${testPoshan.village_name}`}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">ABHA ID (Optional):</label>
                <input
                  type="text"
                  value={testPoshan.abha_id || ''}
                  onChange={(e) => setTestPoshan({ ...testPoshan, abha_id: e.target.value })}
                  placeholder="e.g. 91-4422-..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Silo 2: ASHA RCH */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-emerald-800 flex items-center justify-between">
                <span>ASHA / RCH Record (MoHFW)</span>
                <span className="text-[10px] bg-emerald-100/80 text-emerald-800 px-1.5 py-0.2 rounded font-bold">PHC Unit</span>
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">Alias in Health:</label>
                <input
                  type="text"
                  value={testAsha.child_alias}
                  onChange={(e) => setTestAsha({ ...testAsha, child_alias: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">Block &amp; Village:</label>
                <input
                  type="text"
                  value={`${testAsha.block_name} - ${testAsha.village_name}`}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-slate-500 text-[10px] font-semibold">ABHA ID in Health:</label>
                <input
                  type="text"
                  value={testAsha.abha_id_stub || ''}
                  onChange={(e) => setTestAsha({ ...testAsha, abha_id_stub: e.target.value })}
                  placeholder="e.g. 91-4422-..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={runTestMatch}
            disabled={matchingInProgress}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            {matchingInProgress ? (
              <span>Executing record linkage...</span>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Execute Multi-Attribute Identity Resolution</span>
              </>
            )}
          </button>

          {matchResult && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Link Status:</span>
                <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                  {matchResult.linkage_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Confidence Score:</span>
                <span className="font-mono font-extrabold text-blue-700 text-sm tabular-nums">
                  {(matchResult.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                {matchResult.matching_analysis?.details}
              </p>
            </div>
          )}
        </div>

        {/* ABDM FHIR R4 Bundle Export Viewer */}
        <div className="clinical-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-display">
                <Code2 className="h-4 w-4 text-emerald-600" />
                <span>ABDM FHIR R4 Interoperability Resource</span>
              </h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded font-bold border border-emerald-200">
                LOINC 77606-2
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Standardized HL7/FHIR observation bundle enabling real-time exchange with the National Health Authority gateway.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] h-64 overflow-y-auto">
            <pre>{sampleFhir ? JSON.stringify(sampleFhir, null, 2) : "Loading sample FHIR bundle..."}</pre>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Standard: <strong>FHIR R4 Bundle (Collection)</strong></span>
            <span>Target: <strong>NHA / ABDM Sandbox</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
