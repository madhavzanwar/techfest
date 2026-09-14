import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, AlertCircle, Users, GitMerge, ShieldCheck, 
  Building2, MapPin, UserCheck, Shield, ChevronDown
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, currentRole, setCurrentRole, systemStats }) {
  const roles = [
    { id: 'DISTRICT_OFFICER', label: 'District Program Officer (DPO)', scope: 'Nandurbar District • Macro / DPDP Masked', icon: Building2 },
    { id: 'BLOCK_OFFICER', label: 'Child Dev. Project Officer (CDPO)', scope: 'Dhadgaon Block • Triage Worklist', icon: MapPin },
    { id: 'AWW', label: 'Anganwadi Worker (Frontline)', scope: 'AWC-DHA-CHA-01 • Direct Clinical Beat', icon: UserCheck },
    { id: 'ADMIN', label: 'State Poshan Administrator', scope: 'Statewide Oversight & Audit Ledger', icon: ShieldCheck }
  ];

  const currentRoleObj = roles.find(r => r.id === currentRole) || roles[0];

  const navItems = [
    { id: 'overview', label: 'Epidemiological Overview', icon: Activity },
    { id: 'escalations', label: 'Triage Escalation Worklist', icon: AlertCircle, badge: systemStats?.critical_count },
    { id: 'children', label: 'Patient Registry & Velocity', icon: Users },
    { id: 'interop', label: 'Dual-Silo Gateway (ABDM/ASHA)', icon: GitMerge },
    { id: 'governance', label: 'DPDP Governance & Audit', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-sm flex items-center justify-center">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-display">
                POSHAN<span className="text-blue-600">-SURAKSHA</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                Early-Warning DSS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Early-Warning Nutrition Decision-Support System • Poshan 2.0 Operational Console
            </p>
          </div>
        </div>

        {/* Right Info & Role Selector */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">3,500 Monitored Cohort</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Nandurbar Aspirational District</span>
          </div>

          {/* Role-Based Access Control Switcher */}
          <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-subtle p-1 hover:border-slate-300 transition">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-slate-500 font-medium">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline font-semibold text-slate-700">Role:</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-semibold py-1 pr-6 pl-1 focus:outline-none cursor-pointer appearance-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Framer Motion pill */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-100 overflow-x-auto scrollbar-none py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'text-blue-700 bg-blue-50/80 shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </header>
  );
}
