import React from 'react';
import { 
  ShieldCheck, Activity, AlertTriangle, Users, GitMerge, FileText, 
  UserCheck, Building2, MapPin, Eye, Lock
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, currentRole, setCurrentRole, systemStats }) {
  const roles = [
    { id: 'DISTRICT_OFFICER', label: 'District Program Officer (DPO)', scope: 'Nandurbar District (Macro / Redacted)', icon: Building2 },
    { id: 'BLOCK_OFFICER', label: 'Child Dev. Project Officer (CDPO)', scope: 'Dhadgaon Block (Triage View)', icon: MapPin },
    { id: 'AWW', label: 'Anganwadi Worker (Frontline)', scope: 'AWC-DHA-CHA-01 (Beat View / Full Clinical)', icon: UserCheck },
    { id: 'ADMIN', label: 'Mission Poshan 2.0 Administrator', scope: 'State Oversight & Full Audit Log', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-500 via-white to-green-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                POSHAN<span className="text-sky-400">-SURAKSHA</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                Early-Warning DSS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Maternal & Early Childhood Nutrition Platform • Techfest, IIT Bombay 2026-27
            </p>
          </div>
        </div>

        {/* Right Info & Role Selector */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Cohort: 3,500 Monitored</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Nandurbar (Tribal Belt)</span>
          </div>

          {/* Role-Based Access Control Switcher */}
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <div className="flex items-center space-x-1.5 px-2 text-xs text-amber-400">
              <Lock className="h-3.5 w-3.5" />
              <span className="font-semibold hidden sm:inline">Role:</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-slate-900 text-xs text-slate-100 font-medium py-1 px-2 rounded-md border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800/80 pt-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-sky-400 text-sky-400 bg-sky-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Epidemiological Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'escalations'
              ? 'border-rose-500 text-rose-400 bg-rose-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Early-Warning Escalation Queue</span>
          {systemStats?.critical_count ? (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-900/80 text-rose-200 text-[10px] font-bold border border-rose-700">
              {systemStats.critical_count}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('children')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'children'
              ? 'border-sky-400 text-sky-400 bg-sky-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Child Registry & Velocity</span>
        </button>

        <button
          onClick={() => setActiveTab('interop')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'interop'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <GitMerge className="h-4 w-4" />
          <span>Identity Resolution (ABDM/ASHA)</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'governance'
              ? 'border-purple-400 text-purple-400 bg-purple-950/30'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>DPDP Act & Audit Log</span>
        </button>
      </div>
    </header>
  );
}
