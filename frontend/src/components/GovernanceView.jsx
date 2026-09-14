import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, FileText, CheckCircle, AlertTriangle, 
  Eye, RefreshCw, KeyRound, Database, FileCheck 
} from 'lucide-react';

export default function GovernanceView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs?limit=40');
      const data = await res.json();
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const dpdpMappings = [
    {
      section: "Section 9 (Processing of Personal Data of Children)",
      obligation: "Verifiable parental/guardian consent; prohibition on tracking or behavioral monitoring that harms child well-being.",
      implementation: "Every record captures a verifiable guardian consent token and timestamp. Analytics are strictly constrained to clinical triage and nutritional rehabilitation."
    },
    {
      section: "Section 8 (Data Minimization & General Obligations)",
      obligation: "Fiduciary must ensure data accuracy, retain only for mandated period, and minimize exposure to unauthorized tiers.",
      implementation: "District-level administrators see aggregated or initials-masked PII by default (A*** P***). Unmasked identifiers are strictly restricted to the Anganwadi Worker's assigned beat."
    },
    {
      section: "Section 5 & 6 (Notice and Request for Consent)",
      obligation: "Notice must specify purpose, items of personal data, and manner of exercising grievance redressal.",
      implementation: "Consent status flags (EXPLICIT_CONSENT_GRANTED, PENDING, WITHDRAWN) are maintained per child. Withdrawn consent immediately halts secondary analytics while preserving acute lifesaving medical emergency care."
    },
    {
      section: "Section 10 (Significant Data Fiduciary Obligations)",
      obligation: "Conduct Data Protection Impact Assessment (DPIA), appoint Data Protection Officer, and maintain verifiable audit records.",
      implementation: "Cryptographic, tamper-evident SQLite audit ledger logging actor ID, role, exact query filters, clinical justification, and client IP hash for every access event."
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Governance, Child Data Safeguards &amp; Tamper-Evident Audit Trail
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Child nutritional data constitutes highly sensitive personal health data. Under India's DPDP Act 2023, public health surveillance platforms must balance clinical urgency with strict data minimization, granular consent accounting, and continuous supervisory accountability.
          </p>
        </div>
      </div>

      {/* DPDP Statutory Mapping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dpdpMappings.map((item, idx) => (
          <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
              <FileCheck className="h-4 w-4" />
              <span>{item.section}</span>
            </div>
            <div className="text-xs text-slate-400">
              <strong className="text-slate-300">Statutory Mandate:</strong> {item.obligation}
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-emerald-300 leading-relaxed">
              <strong className="text-white block text-[11px] uppercase tracking-wider mb-1">Architectural Safeguard:</strong>
              {item.implementation}
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Audit Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span>Tamper-Evident Access &amp; Escalation Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Immutable sequential audit entries demonstrating accountability for every dataset access and frontline clinical decision.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor Role &amp; ID</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource Accessed</th>
                <th className="py-3 px-4">Documented Justification</th>
                <th className="py-3 px-4">PII Redacted</th>
                <th className="py-3 px-4">Client IP Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-sans">
                    Loading audit ledger records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-sans">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-sky-400 font-sans">
                      <div>{l.user_role}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.user_id}</div>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold font-sans">{l.action}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{l.resource_accessed}</td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-xs max-w-xs">{l.justification}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                        l.pii_redacted 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {l.pii_redacted ? 'YES (Masked)' : 'NO (Clinical Beat)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">{l.ip_hash}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
