import React, { useState } from 'react';
import ChecksList, { Check } from './ChecksList';
import { Shield, Search, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const URLScanner = () => {
  const [url, setUrl] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [riskClassification, setRiskClassification] = useState('');

  const [findings, setFindings] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/scans/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setRiskScore(data.riskScore);
        setRiskClassification(data.riskClassification);
        setFindings(data.findings);
        setRecommendations(data.recommendations);
        setChecks(data.checks || []);
      } else {
        setError(data.message || 'Scan failed');
      }
    } catch (err) {
      setError('Error connecting to scanner service');
      console.error('Scan error:', err);
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
              <h2 className="text-3xl font-bold text-slate-50 mb-2">URL Security Scanner</h2>
              <p className="text-slate-400 mb-4">Enter a URL to check for potential security risks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter URL (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="bg-white/[0.05] border border-white/10 rounded-lg px-6 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
              aria-label="Enter URL to scan"
            />
            <button
              onClick={handleScan}
              disabled={loading || !url.trim()}
              className={`bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white px-8 py-3 rounded-full font-bold text-lg hover:brightness-110 transition-colors shadow-lg shadow-cyan-400/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Scanning (up to 10 seconds)...' : 'Scan Now'}
            </button>
          </div>
        </div>

        {/* Risk Score Display */}
        {riskClassification && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-slate-50">Risk Assessment</h3>
              <span className={`text-xl font-bold ${riskClassification === 'High Risk' ? 'text-rose-400' : riskClassification === 'Medium Risk' ? 'text-amber-300' : 'text-emerald-300'}`}>
                {riskScore}/100
              </span>
            </div>

            <div className="bg-white/[0.06] rounded-xl p-6">
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full ${riskClassification === 'High Risk' ? 'bg-rose-500' : riskClassification === 'Medium Risk' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.max(riskScore, 4)}%` }}
                />
              </div>
              <p className={`text-lg font-semibold ${riskClassification === 'High Risk' ? 'text-rose-400' : riskClassification === 'Medium Risk' ? 'text-amber-300' : 'text-emerald-300'}`}>
                {riskClassification}
              </p>
            </div>
          </div>
        )}

        <ChecksList checks={checks} title="Live Checks" />

        {/* Findings */}
        {findings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-50 mb-4">Security Findings</h3>
            <div className="space-y-3">
              {findings.map((finding, index) => (
                <div key={index} className="bg-white/[0.06] rounded-lg p-4 flex items-start gap-3">
                  <div className="w-3 h-3 bg-amber-400 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-slate-400 flex-1">{finding}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-50 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white/[0.06] rounded-lg p-4 flex items-start gap-3">
                  <div className="w-3 h-3 text-cyan-300 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-slate-400 flex-1">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan history or info */}
        {!findings.length && !loading && (
          <p className="text-slate-400 text-sm mt-4">
            Enter a URL above to scan for security risks and potential threats.
          </p>
        )}
      </div>
    </section>
  );
};

export default URLScanner;