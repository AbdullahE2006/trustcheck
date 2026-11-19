import React, { useState } from 'react';
import { Shield, Mail, MessageCircle, AlertCircle, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmailPhishingAnalyzer = () => {
  const [emailContent, setEmailContent] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [phishingIndicators, setPhishingIndicators] = useState<string[]>([]);
  const [securityReport, setSecurityReport] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const analyzeEmail = async () => {
    if (!emailContent.trim()) {
      setError('Please paste email content to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/scans/email-phishing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailContent }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setRiskScore(data.riskScore);
        setPhishingIndicators(data.phishingIndicators);
        setSecurityReport(data.securityReport);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Error connecting to analysis service');
      console.error('Email analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-10 h-10 text-cyan-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Email Phishing Analyzer</h2>
              <p className="text-slate-400 mb-4">Paste email content to check for phishing indicators</p>
            </div>
          </div>

          <textarea
            placeholder="Paste email content here..."
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            disabled={loading}
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 min-h[200px] transition-colors"
            rows={4}
            aria-label="Paste email content"
          ></textarea>
        </div>

        <button
          onClick={analyzeEmail}
          disabled={loading || !emailContent.trim()}
          className={`w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white px-4 py-3 rounded-full font-bold text-lg hover:brightness-110 transition-colors shadow-lg shadow-cyan-400/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Analyzing...' : 'Analyze Email'}
        </button>

        {/* Risk Score */}
        {riskScore > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-slate-50">Risk Assessment</h3>
              <span className={`text-xl font-bold ${riskScore >= 70 ? 'text-red-400' : riskScore >= 40 ? 'text-amber-400' : 'text-green-400'}`}>
                {riskScore}/100
              </span>
            </div>
            
            <div className="bg-white/[0.06] rounded-xl p-6">
              <p className={`text-slate-400 ${riskScore >= 70 ? 'text-red-400' : riskScore >= 40 ? 'text-amber-400' : 'text-green-400'}`}>
                {riskScore >= 70 ? 'High Confidence Phishing' : riskScore >= 40 ? 'Suspicious' : 'Safe'}
              </p>
            </div>
          </div>
        )}

        {/* Phishing Indicators */}
        {phishingIndicators.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-50 mb-4">Phishing Indicators</h3>
            <div className="grid grid-cols-2 gap-3">
              {phishingIndicators.map((indicator, index) => (
                <div key={index} className="bg-white/[0.06] rounded-lg p-3 flex items-start gap-2">
                  <div className="w-2 h-2 text-amber-300 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-slate-400">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Report */}
        {securityReport && (
          <div>
            <h3 className="text-xl font-bold text-slate-50 mb-4">Security Report</h3>
            <pre className="bg-white/[0.06] rounded-lg p-6 text-sm overflow-x-auto">
              {securityReport}
            </pre>
          </div>
        )}

        {/* Fallback text */}
        {!riskScore && !loading && (
          <p className="text-slate-400 text-sm mt-4">
            Paste email content to check for phishing indicators.
          </p>
        )}
      </div>
    </section>
  );
};

export default EmailPhishingAnalyzer;