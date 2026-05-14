import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ShaderBackground } from './components/ShaderBackground';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ReportPage } from './pages/ReportPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { AnalysisInputPage } from './pages/AnalysisInputPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
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
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/rapport/:id" element={<ReportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

