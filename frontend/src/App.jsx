import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Fixed Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        systemStats={stats}
      />

      {/* Main Content Area with Animated Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Child Detailed Inspection Modal */}
      <AnimatePresence>
        {selectedChildId && (
          <ChildDetailModal
            childId={selectedChildId}
            onClose={() => setSelectedChildId(null)}
            currentRole={currentRole}
          />
        )}
      </AnimatePresence>

      {/* Operational Clinical Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">POSHAN-SURAKSHA</span>
            <span className="text-slate-300">•</span>
            <span>v1.0.0 Operational Console</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Clinical Early-Warning &amp; Decision-Support System</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            WHO Child Growth Standards • ABDM FHIR R4 Interoperability • Nandurbar Pilot
          </div>
        </div>
      </footer>
    </div>
  );
}
