import { useState } from "react";
import Layout from "@/components/Layout";
import ClientManagement from "./ClientManagement";
import Ledger from "./Ledger";
import Reports from "./Reports";

export default function Home() {
  const [currentView, setCurrentView] = useState<'clients' | 'ledger' | 'reports'>('clients');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const handleClientSelect = (clientId: number) => {
    setSelectedClientId(clientId);
    setCurrentView('ledger');
  };

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
          onClientSelect={setSelectedClientId}
        />
      )}
      {currentView === 'reports' && <Reports />}
    </Layout>
  );
}
