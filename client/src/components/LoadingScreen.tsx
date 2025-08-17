import { Stethoscope, Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Stethoscope className="text-primary text-3xl" size={40} />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-3xl font-bold text-white mb-2">Nutri Suppliers</h1>
        <p className="text-blue-100 mb-8">Digital Ledger for Medical Suppliers</p>
        
        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="animate-spin text-white" size={24} />
          <span className="text-white text-lg">Loading...</span>
        </div>
        
        {/* Loading Dots */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
