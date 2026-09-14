import React, { useState, useEffect } from 'react';
import { 
  GitMerge, CheckCircle, AlertCircle, RefreshCw, Database, 
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

      // Also grab one sample FHIR bundle
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
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold mb-3">
            <GitMerge className="h-3.5 w-3.5" />
            <span>Dual-Registry Reconciliation &amp; ABDM Gateway</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Interoperability Layer: Reconciling Siloed Ministries (MWCD ↔ MoHFW)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The core bottleneck in Indian nutrition policy is that Anganwadi growth charts (MWCD Poshan Tracker) and Primary Health Centre illness/immunization records (MoHFW RCH) use completely separate identifier schemes. 
            This layer implements a <strong>3-tier hybrid identity resolution engine</strong> (Deterministic ABHA → Biometric Blinded Token → Fellegi-Sunter Probabilistic Linkage), generating a unified child clinical view formatted to Ayushman Bharat Digital Mission (ABDM) FHIR standards.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="text-xs text-slate-400 font-medium">Reconciliation Coverage</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              {stats.overall_linkage_rate_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.total_linked.toLocaleString()} / {stats.total_records.toLocaleString()} records reconciled
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="text-xs text-slate-400 font-medium">ABDM ABHA Penetration</div>
            <div className="text-3xl font-extrabold text-sky-400 mt-2 font-mono">
              {stats.abha_coverage_pct}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">National Health Authority Health ID</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="text-xs text-slate-400 font-medium">Probabilistic Fuzzy Matches</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
              34.2%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Phonetic Soundex + DOB window</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
            <div className="text-xs text-slate-400 font-medium">Unresolved / Orphaned Records</div>
            <div className="text-3xl font-extrabold text-slate-400 mt-2 font-mono">
              {(100 - stats.overall_linkage_rate_pct).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Queued for frontline beat survey</div>
          </div>
        </div>
      )}

      {/* Matching Breakdown Table */}
      {stats && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            Record Linkage Methodology Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Tiered fallback logic ensuring resilient matching even when parents lack Aadhaar or ABHA credentials.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Linkage Methodology</th>
                  <th className="py-3 px-4">Record Count</th>
                  <th className="py-3 px-4">Confidence Tier</th>
                  <th className="py-3 px-4">Confidence Range</th>
                  <th className="py-3 px-4">Governance Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {stats.linkage_breakdown.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${
                        idx === 0 ? 'bg-emerald-400' : idx === 1 ? 'bg-sky-400' : idx <= 3 ? 'bg-amber-400' : 'bg-slate-500'
                      }`}></span>
                      <span>{b.method}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{b.count.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {b.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-400 font-bold">{b.confidence}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {idx === 0 ? 'Auto-linked (ABDM API Verified)' :
                       idx === 1 ? 'Blinded Biometric Token' :
                       idx === 2 ? 'Multi-attribute algorithmic match' :
                       idx === 3 ? 'ASHA physical home-visit confirmation' : 'Manual census reconciliation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Identity Resolution Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-sky-400" />
              <span>Interactive Dual-Silo Linkage Simulator</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Live API</span>
          </div>
          <p className="text-xs text-slate-400">
            Test the identity reconciliation algorithm against simulated asynchronous registrations with phonetic spelling variations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Silo 1: Poshan */}
            <div className="bg-slate-950 p-3 rounded-xl border border-sky-900/60 space-y-2">
              <div className="font-bold text-sky-400 flex items-center justify-between">
                <span>Poshan Tracker (MWCD)</span>
                <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800">AWC Beat</span>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Name in Poshan:</label>
                <input
                  type="text"
                  value={testPoshan.pseudonym_name}
                  onChange={(e) => setTestPoshan({ ...testPoshan, pseudonym_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Block &amp; Village:</label>
                <input
                  type="text"
                  value={`${testPoshan.block_name} - ${testPoshan.village_name}`}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800 rounded p-1.5 text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">ABHA ID:</label>
                <input
                  type="text"
                  value={testPoshan.abha_id || ''}
                  onChange={(e) => setTestPoshan({ ...testPoshan, abha_id: e.target.value })}
                  placeholder="Optional (e.g. 91-...)"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Silo 2: ASHA RCH */}
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/60 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center justify-between">
                <span>ASHA / RCH Record (MoHFW)</span>
                <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">PHC Unit</span>
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Child Alias in Health:</label>
                <input
                  type="text"
                  value={testAsha.child_alias}
                  onChange={(e) => setTestAsha({ ...testAsha, child_alias: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Block &amp; Village:</label>
                <input
                  type="text"
                  value={`${testAsha.block_name} - ${testAsha.village_name}`}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800 rounded p-1.5 text-slate-400"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">ABHA ID in Health:</label>
                <input
                  type="text"
                  value={testAsha.abha_id_stub || ''}
                  onChange={(e) => setTestAsha({ ...testAsha, abha_id_stub: e.target.value })}
                  placeholder="Optional (e.g. 91-...)"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={runTestMatch}
            disabled={matchingInProgress}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow flex items-center justify-center space-x-2"
          >
            {matchingInProgress ? (
              <span>Running probabilistic linkage engine...</span>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Execute Multi-Attribute Identity Resolution</span>
              </>
            )}
          </button>

          {matchResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Resulting Link Status:</span>
                <span className="font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {matchResult.linkage_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-mono font-extrabold text-sky-400 text-sm">
                  {(matchResult.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                {matchResult.matching_analysis?.details}
              </p>
            </div>
          )}
        </div>

        {/* ABDM FHIR R4 Bundle Export Viewer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>ABDM FHIR R4 Standard Interoperability Payload</span>
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                LOINC / HL7 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Standardized HL7/FHIR observation resource bundle enabling real-time transmission between Ayushman Bharat Health Information Exchange and state nutrition dashboards.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto">
            <pre>{sampleFhir ? JSON.stringify(sampleFhir, null, 2) : "Loading sample FHIR bundle..."}</pre>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Standard: <strong>FHIR R4 Bundle (Collection)</strong></span>
            <span>Target: <strong>NHA Gateway</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
