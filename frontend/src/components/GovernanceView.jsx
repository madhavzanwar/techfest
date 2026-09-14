import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, 
  RefreshCw, Database, FileCheck, ShieldAlert 
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
      obligation: "Verifiable parental/guardian consent; statutory prohibition on tracking or behavioral profiling harmful to children.",
      implementation: "Every record captures a verifiable guardian consent token and timestamp. Algorithmic scoring is strictly constrained to clinical triage and therapeutic nutrition."
    },
    {
      section: "Section 8 (Data Minimization & General Obligations)",
      obligation: "Ensure personal data accuracy, retain only for mandated period, and minimize exposure to unauthorized administrative tiers.",
      implementation: "District-level administrators see aggregated or initials-masked PII by default (A*** P***). Unmasked identifiers are strictly restricted to the Anganwadi Worker's assigned beat."
    },
    {
      section: "Section 5 & 6 (Notice and Request for Consent)",
      obligation: "Notice must clearly specify purpose, items of personal data, and manner of exercising grievance redressal.",
      implementation: "Consent status flags (EXPLICIT_CONSENT_GRANTED, PENDING, WITHDRAWN) are maintained per child. Withdrawn consent immediately drops records from secondary dashboards."
    },
    {
      section: "Section 10 (Significant Data Fiduciary Obligations)",
      obligation: "Conduct Data Protection Impact Assessment (DPIA), appoint Data Protection Officer, and maintain verifiable audit records.",
      implementation: "Cryptographic, tamper-evident SQLite audit ledger logging actor ID, role, exact query filters, clinical justification, and client IP hash for every access event."
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Clinical Card */}
      <div className="clinical-card rounded-2xl p-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
            <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliance</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">
            Child Data Protection Safeguards &amp; Tamper-Evident Regulatory Audit Trail
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Child nutritional metrics constitute sensitive biometric and clinical health data. Under India's DPDP Act 2023, public health decision-support systems must balance urgent lifesaving triage with strict data minimization, granular guardian consent accounting, and continuous institutional accountability.
          </p>
        </div>
      </div>

      {/* DPDP Statutory Mapping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dpdpMappings.map((item, idx) => (
          <div key={idx} className="clinical-card rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs font-display">
              <FileCheck className="h-4 w-4 shrink-0" />
              <span>{item.section}</span>
            </div>
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800 font-semibold">Statutory Mandate:</strong> {item.obligation}
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-blue-900 block text-[10px] uppercase tracking-wider mb-1 font-bold">
                Architectural Safeguard:
              </strong>
              {item.implementation}
            </div>
          </div>
        ))}
      </div>

      {/* Real-time Audit Ledger */}
      <div className="clinical-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 font-display">
              <Database className="h-4 w-4 text-purple-700" />
              <span>Tamper-Evident Access &amp; Escalation Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Immutable sequential audit entries demonstrating accountability for every dataset query and clinical decision.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center space-x-1.5 transition shadow-subtle"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor Role &amp; ID</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Resource Accessed</th>
                <th className="py-3 px-4">Documented Justification</th>
                <th className="py-3 px-4">PII Redacted</th>
                <th className="py-3 px-4">Client IP Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-sans">
                    Loading audit ledger entries...
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
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{l.timestamp.slice(0, 19)}</td>
                    <td className="py-3 px-4 text-blue-700 font-sans">
                      <div className="font-bold">{l.user_role}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.user_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold font-sans">{l.action}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{l.resource_accessed}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans text-xs max-w-xs">{l.justification}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                        l.pii_redacted 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {l.pii_redacted ? 'YES (Masked)' : 'NO (Beat Scope)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">{l.ip_hash}</td>
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
