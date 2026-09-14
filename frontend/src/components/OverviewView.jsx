import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { 
  AlertCircle, CheckCircle2, TrendingDown, Users, Shield, 
  Building, Clock, ArrowUpRight, Activity, GitBranch 
} from 'lucide-react';

const TIER_COLORS = {
  Critical: '#ef4444',
  Watch: '#f59e0b',
  Normal: '#10b981'
};

export default function OverviewView({ stats, onNavigateToEscalations }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mr-3"></div>
        Loading epidemiological overview...
      </div>
    );
  }

  const pieData = [
    { name: 'Critical Tier', value: stats.critical_count, color: '#ef4444' },
    { name: 'Watch Tier (Early Warning)', value: stats.watch_count, color: '#f59e0b' },
    { name: 'Normal / Stable', value: stats.normal_count, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Competition Anchor Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-800/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-900/60 border border-sky-700 text-sky-300 text-xs font-semibold mb-3">
            <Activity className="h-3.5 w-3.5" />
            <span>Techfest IIT Bombay 2026-27 • Theme 1: Maternal & Early Childhood Nutrition</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Closing the "Data-to-Action" Gap in Frontline Nutrition Infrastructure
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            India's Poshan Tracker digitally tracks over 9 crore children, yet severe undernutrition persists because data remains siloed in retrospective compliance dashboards. 
            <strong> Poshan-Suraksha</strong> introduces a <em>clinical-triage early warning engine</em> that fuses Anganwadi anthropometric velocity with ASHA health morbidity records, auto-escalating high-risk children <strong>before</strong> severe acute malnutrition (SAM) manifests.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Cohort</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {stats.total_children_monitored.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nandurbar District</div>
        </div>

        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium">
            <span>Critical (SAM)</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {stats.critical_count}
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1 font-semibold">{stats.critical_pct}% (SLA: 48 hrs)</div>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-300 text-xs font-medium">
            <span>Watch (Faltering)</span>
            <TrendingDown className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats.watch_count}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1 font-semibold">{stats.watch_pct}% (Velocity Drop)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Stunting Rate</span>
            <Building className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {stats.stunting_pct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">HAZ &lt; -2 SD (NFHS-5)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Wasting (MAM+SAM)</span>
            <AlertCircle className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {stats.wasting_pct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">WHZ &lt; -2 SD</div>
        </div>

        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium">
            <span>Interoperability</span>
            <GitBranch className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {stats.interoperability_link_rate}%
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Poshan ↔ ASHA Link</div>
        </div>

        <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-sky-300 text-xs font-medium">
            <span>SLA Compliance</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-2">
            {stats.escalation_sla_compliance_pct}%
          </div>
          <div className="text-[11px] text-sky-300/80 mt-1 font-semibold">{stats.cases_pending_action} Active Escalations</div>
        </div>
      </div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Donut */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Clinical Triage Distribution
              </h3>
              <span className="text-xs text-slate-400 font-mono">WHO Standards</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Automated multi-domain risk classification categorizing children into tiered escalation queues.
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white">{stats.total_children_monitored}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Children</span>
            </div>
          </div>

          <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-rose-400">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                <span className="font-semibold">Critical Tier (SAM / Kwashiorkor)</span>
              </div>
              <span className="font-bold">{stats.critical_count} ({stats.critical_pct}%)</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                <span className="font-semibold">Watch Tier (Early Warning Drop)</span>
              </div>
              <span className="font-bold">{stats.watch_count} ({stats.watch_pct}%)</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold">Normal / Stable</span>
              </div>
              <span className="font-bold">{stats.normal_count} ({stats.normal_pct}%)</span>
            </div>
          </div>
        </div>

        {/* Block-Wise Breakdown Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Cross-Block Malnutrition Burden (Nandurbar District)
              </h3>
              <span className="text-xs text-sky-400 font-semibold bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                Aspirational Tribal Blocks
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Comparing case distributions across 5 administrative blocks to prioritize mobile medical teams and nutritional supply allocations.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.block_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="block_name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="critical" name="Critical (SAM)" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="watch" name="Watch (Faltering)" fill="#f59e0b" stackId="a" />
                <Bar dataKey="normal" name="Normal" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
            <span>Highest Burden: <strong className="text-rose-400">Dhadgaon &amp; Akkalkuwa</strong> (Hilly Tribal Belt)</span>
            <button 
              onClick={onNavigateToEscalations}
              className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-semibold transition"
            >
              <span>View Escalation Queue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Longitudinal Trajectory Trend Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Longitudinal Early-Warning Velocity Trajectory (Months T-2 to T0)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates why retrospective dashboards fail: tracking 3-month velocity allows intervention before irreversible wasting manifests.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
            Velocity Faltering Detected 3-6 Wks in Advance
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trend_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="mamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="critical_sam" name="SAM Cases" stroke="#ef4444" fillOpacity={1} fill="url(#critGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="moderate_mam" name="MAM / Wasted Cases" stroke="#f59e0b" fillOpacity={1} fill="url(#mamGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
