import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, CartesianGrid 
} from 'recharts';
import { 
  AlertCircle, TrendingDown, Users, Building, 
  Clock, ArrowUpRight, Activity, GitBranch, ArrowRight, ShieldCheck
} from 'lucide-react';

const TRIAGE_PALETTE = {
  Critical: '#DC2626',
  Watch: '#D97706',
  Normal: '#059669'
};

export default function OverviewView({ stats, onNavigateToEscalations }) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-3"></div>
        <span className="text-xs font-medium">Aggregating district epidemiological indicators...</span>
      </div>
    );
  }

  const pieData = [
    { name: 'Critical Tier (SAM/Kwashiorkor)', value: stats.critical_count, color: '#DC2626' },
    { name: 'Watch Tier (Rapid Faltering)', value: stats.watch_count, color: '#D97706' },
    { name: 'Normal / Stable Growth', value: stats.normal_count, color: '#059669' },
  ];

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Editorial Clinical Briefing Banner */}
      <motion.div 
        variants={itemAnimation}
        className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="max-w-4xl relative">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            <Activity className="h-3.5 w-3.5 text-blue-600" />
            <span>Techfest IIT Bombay 2026-27 • Theme 1: Maternal &amp; Early Childhood Nutrition</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-display leading-snug">
            Shifting Nutrition Infrastructure from Retrospective Audits to Proactive Clinical Triage
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            India's Poshan Tracker digitally monitors ~9 crore children, yet severe undernutrition persists in underserved tribal belts because data remains confined to retrospective reporting. 
            <strong className="text-slate-900 font-semibold"> Poshan-Suraksha</strong> introduces a <em>clinical decision-support engine</em> that reconciles Anganwadi growth charts with ASHA health morbidity records, detecting growth faltering and auto-escalating high-risk infants <strong>3 to 6 weeks before</strong> severe acute malnutrition (SAM) manifests.
          </p>
        </div>
      </motion.div>

      {/* Top Metric Cards Grid */}
      <motion.div variants={itemAnimation} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="clinical-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Cohort</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums font-display">
            {stats.total_children_monitored.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nandurbar District</div>
        </div>

        <div className="bg-red-50/80 border border-red-200/90 rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between text-red-700 text-xs font-bold">
            <span>Critical (SAM)</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-extrabold text-red-700 mt-2 tabular-nums font-display">
            {stats.critical_count}
          </div>
          <div className="text-[11px] text-red-800 mt-1 font-semibold">{stats.critical_pct}% • SLA: 48h</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
            <span>Watch Tier</span>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 mt-2 tabular-nums font-display">
            {stats.watch_count}
          </div>
          <div className="text-[11px] text-amber-800 mt-1 font-semibold">{stats.watch_pct}% • Velocity Drop</div>
        </div>

        <div className="clinical-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Stunting Rate</span>
            <Building className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums font-display">
            {stats.stunting_pct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">HAZ &lt; -2 SD (NFHS-5)</div>
        </div>

        <div className="clinical-card rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Wasting Rate</span>
            <AlertCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tabular-nums font-display">
            {stats.wasting_pct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">WHZ &lt; -2 SD</div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Interoperability</span>
            <GitBranch className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-2 tabular-nums font-display">
            {stats.interoperability_link_rate}%
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Poshan ↔ ASHA Reconciled</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 shadow-subtle">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
            <span>SLA Compliance</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-800 mt-2 tabular-nums font-display">
            {stats.escalation_sla_compliance_pct}%
          </div>
          <div className="text-[11px] text-blue-700 mt-1 font-semibold">{stats.cases_pending_action} Active Worklist</div>
        </div>
      </motion.div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Donut Chart */}
        <motion.div variants={itemAnimation} className="clinical-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Clinical Triage Distribution
              </h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                WHO Standards
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Composite risk stratification grouping children into immediate triage pathways.
            </p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                    color: '#0F172A'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 font-display tabular-nums">
                {stats.total_children_monitored.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Cohort</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between text-red-700 font-medium">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span>
                <span className="font-semibold">Critical Tier (SAM / Kwashiorkor)</span>
              </div>
              <span className="font-bold tabular-nums">{stats.critical_count} ({stats.critical_pct}%)</span>
            </div>
            <div className="flex items-center justify-between text-amber-700 font-medium">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                <span className="font-semibold">Watch Tier (Early Faltering)</span>
              </div>
              <span className="font-bold tabular-nums">{stats.watch_count} ({stats.watch_pct}%)</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                <span className="font-semibold">Normal / Stable Range</span>
              </div>
              <span className="font-bold tabular-nums">{stats.normal_count} ({stats.normal_pct}%)</span>
            </div>
          </div>
        </motion.div>

        {/* Block-Wise Cross Comparison Bar Chart */}
        <motion.div variants={itemAnimation} className="clinical-card rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Cross-Block Malnutrition Distribution (Nandurbar District)
              </h3>
              <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                5 High-Burden Tribal Blocks
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparing case distributions across administrative blocks to guide mobile medical teams and nutritional supply allocations.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.block_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="block_name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E2E8F0', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                    color: '#0F172A'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="critical" name="Critical (SAM)" fill="#DC2626" stackId="a" radius={[0, 0, 0, 0]} animationDuration={800} />
                <Bar dataKey="watch" name="Watch (Faltering)" fill="#D97706" stackId="a" radius={[0, 0, 0, 0]} animationDuration={800} />
                <Bar dataKey="normal" name="Normal" fill="#059669" stackId="a" radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span>Tribal Pocket Focus: <strong className="text-red-700">Dhadgaon &amp; Akkalkuwa</strong> exhibit highest SAM density</span>
            <button 
              onClick={onNavigateToEscalations}
              className="inline-flex items-center space-x-1.5 text-blue-700 hover:text-blue-800 font-semibold transition"
            >
              <span>View Triage Worklist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Longitudinal Trajectory Trend Section */}
      <motion.div variants={itemAnimation} className="clinical-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
              Longitudinal Growth Trajectory Trend (Months T-2 to T0 Current)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Demonstrates why retrospective dashboards fail: tracking 60-day velocity catches faltering trajectories before irreversible collapse.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0 font-medium">
            3 to 6 Week Early Detection Window
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trend_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="critGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="mamGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  color: '#0F172A'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="critical_sam" name="Critical SAM Cases" stroke="#DC2626" fillOpacity={1} fill="url(#critGradLight)" strokeWidth={2} animationDuration={800} />
              <Area type="monotone" dataKey="moderate_mam" name="Moderate MAM Cases" stroke="#D97706" fillOpacity={1} fill="url(#mamGradLight)" strokeWidth={2} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
