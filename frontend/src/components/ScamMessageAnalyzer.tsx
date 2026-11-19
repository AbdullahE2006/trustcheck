import React, { useState } from 'react';
import { Shield, Mail, MessageSquare, AlertCircle, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScamMessageAnalyzerProps {
  onResult?: (result: {
    riskScore: number;
    scamIndicators: string[];
    explanation: string;
    safetyRecommendations: string[];
  }) => void;
}

const ScamMessageAnalyzer = ({ onResult }: ScamMessageAnalyzerProps) => {
  const [message, setMessage] = useState('');
  const [riskScore, setRiskScore] = useState(0);
  const [scamIndicators, setScamIndicators] = useState<string[]>([]);
  const [explanation, setExplanation] = useState('');
  const [safetyRecommendations, setSafetyRecommendations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const analyzeMessage = async () => {
    if (!message.trim()) {
      setError('Please paste a message to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/scans/scam-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setRiskScore(data.riskScore);
        setScamIndicators(data.scamIndicators);
        setExplanation(data.explanation);
        setSafetyRecommendations(data.safetyRecommendations);
        onResult?.(data);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Error connecting to analysis service');
      console.error('Analysis error:', err);
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
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Scam Message Analyzer</h2>
              <p className="text-slate-400 mb-4">Paste a suspicious message from WhatsApp, SMS, Email, or social media</p>
            </div>
          </div>

          <textarea
            placeholder="Paste suspicious message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-4 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 min-h[150px] transition-colors"
            rows={3}
            aria-label="Paste suspicious message"
          ></textarea>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={analyzeMessage}
            disabled={loading || !message.trim()}
            className={`flex-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white px-4 py-3 rounded-full font-bold text-lg hover:brightness-110 transition-colors shadow-lg shadow-cyan-400/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Analyzing...' : 'Analyze Message'}
          </button>
        </div>

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
                {riskScore >= 70 ? 'Highly Likely Scam' : riskScore >= 40 ? 'Potential Scam' : 'Safe'}
              </p>
            </div>
          </div>
        )}

        {/* Scam Indicators */}
        {scamIndicators.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-50 mb-4">Scam Indicators Detected</h3>
            <div className="grid grid-cols-2 gap-3">
              {scamIndicators.map((indicator, index) => (
                <div key={index} className="bg-white/[0.06] rounded-lg p-3 flex items-start gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-slate-400">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {explanation && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-50 mb-4">Analysis Explanation</h3>
            <p className="text-slate-400">{explanation}</p>
          </div>
        )}

        {/* Safety Recommendations */}
        {safetyRecommendations.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-slate-50 mb-4">Safety Recommendations</h3>
            <div className="grid grid-cols-2 gap-3">
              {safetyRecommendations.map((rec, index) => (
                <div key={index} className="bg-white/[0.06] rounded-lg p-3 flex items-start gap-2">
                  <div className="w-2 h-2 text-cyan-300 rounded-full flex-shrink-0 mt-1"></div>
                  <span className="text-slate-400">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback text */}
        {!riskScore && !loading && (
          <p className="text-slate-400 text-sm mt-4">
            Paste a suspicious message to analyze it for scam indicators.
          </p>
        )}
      </div>
    </section>
  );
};

export default ScamMessageAnalyzer;