import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ShaderBackground } from './components/ShaderBackground';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ReportPage } from './pages/ReportPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AnalysisInputPage } from './pages/AnalysisInputPage';
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading } = useStore();
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen text-foreground font-sans">
        <ShaderBackground />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyseer" element={<AnalysisInputPage />} />
          <Route path="/hoe-het-werkt" element={<HowItWorksPage />} />
          <Route path="/prijzen" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/over-ons" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/voorwaarden" element={<TermsPage />} />
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/rapport/:id" element={<ReportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

