import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Dashboard from "./Dashboard";
import ClientManagement from "./ClientManagement";
import Ledger from "./Ledger";
import Reports from "./Reports";

export default function Home() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'clients' | 'ledger' | 'reports'>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleClientSelect = (clientId: string | number) => {
    console.log("Home: handleClientSelect called with:", clientId, "type:", typeof clientId);

    const id = typeof clientId === 'number' ? clientId.toString() : clientId;

    console.log("Home: Setting client ID to:", id);
    setSelectedClientId(id);
    setCurrentView('ledger');
  };

  const handleNavigate = (view: 'clients' | 'ledger' | 'reports') => {
    setCurrentView(view);
  };

  const handleClientChange = (clientId: string | null) => {
    console.log("Home: handleClientChange called with:", clientId);
    setSelectedClientId(clientId);
    // Don't change view when changing client in ledger
  };

  // Debug: Monitor state changes
  useEffect(() => {
    console.log("Home: selectedClientId changed to:", selectedClientId);
  }, [selectedClientId]);

  useEffect(() => {
    console.log("Home: currentView changed to:", currentView);
  }, [currentView]);

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      selectedClientId={selectedClientId}
    >
      {currentView === 'dashboard' && (
        <Dashboard
          onNavigate={handleNavigate}
          onClientSelect={handleClientSelect}
        />
      )}
      {currentView === 'clients' && (
        <ClientManagement onClientSelect={handleClientSelect} />
      )}
      {currentView === 'ledger' && (
        <Ledger
          selectedClientId={selectedClientId}
          onClientSelect={handleClientChange}
        />
      )}
      {currentView === 'reports' && <Reports />}
    </Layout>
  );
}
