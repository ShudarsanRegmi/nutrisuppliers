import { useState } from "react";
import { Users, BookOpen, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { signOutUser } from "@/lib/firebaseAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { OfflineIndicator, SyncStatusIndicator } from "@/components/OfflineIndicator";
import { PWAInstallButtonSimple } from "@/components/PWAInstallButton";
import { PWAStatusIndicator } from "@/components/PWAStatus";

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'clients' | 'ledger' | 'reports';
  onViewChange: (view: 'dashboard' | 'clients' | 'ledger' | 'reports') => void;
  selectedClientId?: string | null;
}

export default function Layout({ children, currentView, onViewChange, selectedClientId }: LayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();


  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 sticky-nav border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onViewChange('dashboard')}
                className="text-xl font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
                data-testid="text-app-title"
              >
                Nutri Suppliers
              </button>
              {/* Desktop Navigation */}
              {!isMobile && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onViewChange('clients')}
                    variant={currentView === 'clients' ? 'default' : 'ghost'}
                    className={currentView === 'clients' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}
                    data-testid="button-nav-clients"
                  >
                    Clients
                  </Button>
                  <Button
                    onClick={() => onViewChange('ledger')}
                    variant={currentView === 'ledger' ? 'default' : 'ghost'}
                    className={currentView === 'ledger' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}
                    data-testid="button-nav-ledger"
                  >
                    Ledger
                  </Button>
                  <Button
                    onClick={() => onViewChange('reports')}
                    variant={currentView === 'reports' ? 'default' : 'ghost'}
                    className={currentView === 'reports' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}
                    data-testid="button-nav-reports"
                  >
                    Reports
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* PWA Status */}
              {/* <PWAStatusIndicator /> */}

              {/* PWA Install Button */}
              {/* <PWAInstallButtonSimple /> */}

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium" data-testid="avatar-user">
                  <span>{getInitials(user?.firstName, user?.lastName)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                  data-testid="button-logout"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobile && (
          <div className="border-t border-gray-200">
            <div className="flex">
              <Button
                onClick={() => onViewChange('clients')}
                variant="ghost"
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  currentView === 'clients' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                data-testid="button-mobile-clients"
              >
                <Users className="block mb-1" size={16} />
                Clients
              </Button>
              <Button
                onClick={() => onViewChange('ledger')}
                variant="ghost"
                className={`flex-1 py-3 text-sm font-medium text-center border-r border-gray-200 ${
                  currentView === 'ledger' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                data-testid="button-mobile-ledger"
              >
                <BookOpen className="block mb-1" size={16} />
                Ledger
              </Button>
              <Button
                onClick={() => onViewChange('reports')}
                variant="ghost"
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  currentView === 'reports' ? 'bg-primary text-white' : 'text-gray-700'
                }`}
                data-testid="button-mobile-reports"
              >
                <BarChart3 className="block mb-1" size={16} />
                Reports
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* PWA Indicators */}
      <OfflineIndicator />
      {/* <SyncStatusIndicator /> */}
    </div>
  );
}
