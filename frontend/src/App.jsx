import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import OverviewView from './components/OverviewView';
import EscalationView from './components/EscalationView';
import ChildrenView from './components/ChildrenView';
import InteroperabilityView from './components/InteroperabilityView';
import GovernanceView from './components/GovernanceView';
import ChildDetailModal from './components/ChildDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentRole, setCurrentRole] = useState('DISTRICT_OFFICER');
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchOverviewStats = async () => {
    try {
      const res = await fetch(`/api/overview?role=${currentRole}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load overview metrics:", err);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, [currentRole]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        systemStats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <OverviewView 
            stats={stats} 
            onNavigateToEscalations={() => setActiveTab('escalations')} 
          />
        )}

        {activeTab === 'escalations' && (
          <EscalationView 
            onSelectChild={(id) => setSelectedChildId(id)} 
            currentRole={currentRole}
          />
        )}

        {activeTab === 'children' && (
          <ChildrenView 
            currentRole={currentRole}
            onSelectChild={(id) => setSelectedChildId(id)}
          />
        )}

        {activeTab === 'interop' && (
          <InteroperabilityView />
        )}

        {activeTab === 'governance' && (
          <GovernanceView />
        )}
      </main>

      {/* Child Detailed Inspection Modal */}
      {selectedChildId && (
        <ChildDetailModal
          childId={selectedChildId}
          onClose={() => setSelectedChildId(null)}
          currentRole={currentRole}
        />
      )}

      {/* Institutional Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">The India @ 71/100 Challenge</span>
            <span>•</span>
            <span>Techfest, IIT Bombay 2026-27</span>
            <span>•</span>
            <span className="text-sky-400">Theme 1: Maternal &amp; Early Childhood Nutrition</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Statistically seeded via NFHS-5 &amp; WHO Child Growth Standards (Simulated Tribal District: Nandurbar, Maharashtra)
          </div>
        </div>
      </footer>
    </div>
  );
}
