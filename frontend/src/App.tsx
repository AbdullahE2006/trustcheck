import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsCards from './components/StatsCards';
import URLScanner from './components/URLScanner';
import ScamMessageAnalyzer from './components/ScamMessageAnalyzer';
import EmailPhishingAnalyzer from './components/EmailPhishingAnalyzer';
import PasswordStrengthChecker from './components/PasswordStrengthChecker';
import WebsiteSecurityInformation from './components/WebsiteSecurityInformation';
import CyberAcademy from './components/CyberAcademy';
import SecurityNews from './components/SecurityNews';
import Footer from './components/Footer';
import ToolsGrid from './components/ToolsGrid';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />

      <main className="pt-16 min-h-[70vh]">
        <Routes>
          <Route path="/" element={<div><Hero /><StatsCards /><ToolsGrid /></div>} />
          <Route path="/url-scanner" element={<URLScanner />} />
          <Route path="/scam-analyzer" element={<ScamMessageAnalyzer />} />
          <Route path="/email-analyzer" element={<EmailPhishingAnalyzer />} />
          <Route path="/password-checker" element={<PasswordStrengthChecker />} />
          <Route path="/website-security" element={<WebsiteSecurityInformation />} />
          <Route path="/cyber-academy" element={<CyberAcademy />} />
          <Route path="/security-news" element={<SecurityNews />} />
        </Routes>
      </main>

      <Footer />
    </Router>
  );
};

export default App;