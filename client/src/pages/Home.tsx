import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ClientManagement from "./ClientManagement";
import Ledger from "./Ledger";
import Reports from "./Reports";

export default function Home() {
  const [currentView, setCurrentView] = useState<'clients' | 'ledger' | 'reports'>('clients');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleClientSelect = (clientId: string | number) => {
    console.log("Home: handleClientSelect called with:", clientId, "type:", typeof clientId);

    const id = typeof clientId === 'number' ? clientId.toString() : clientId;

    console.log("Home: Setting client ID to:", id);
    setSelectedClientId(id);
    setCurrentView('ledger');
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
