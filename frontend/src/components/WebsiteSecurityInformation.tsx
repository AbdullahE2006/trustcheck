import { useState } from 'react';
import { Shield } from 'lucide-react';
import ChecksList, { Check } from './ChecksList';

const gradeColor: Record<string, string> = {
  A: 'from-emerald-400 to-teal-400',
  B: 'from-lime-400 to-emerald-400',
  C: 'from-amber-300 to-yellow-400',
  D: 'from-orange-400 to-amber-400',
  F: 'from-rose-500 to-red-500',
};

const WebsiteSecurityInformation = () => {
  const [url, setUrl] = useState('');
  const [httpsStatus, setHttpsStatus] = useState('Unknown');
  const [domainInfo, setDomainInfo] = useState('');
  const [grade, setGrade] = useState('N/A');
  const [score, setScore] = useState(0);
  const [checks, setChecks] = useState<Check[]>([]);
  const [findings, setFindings] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeWebsite = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to check');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/scans/website-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setHttpsStatus(data.httpsStatus);
        setDomainInfo(data.domainInfo);
        setGrade(data.grade);
        setScore(data.score);
        setChecks(data.checks || []);
        setFindings(data.findings || []);
        setRecommendations(data.recommendations || []);
        setDone(true);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Error connecting to analysis service');
      console.error('Website security analysis error:', err);
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
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Website Security Check</h2>
              <p className="text-slate-400 mb-4">
                Live check of a website's SSL certificate, security headers, redirects and domain age.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-2">
            <input
              type="text"
              placeholder="Enter website (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && analyzeWebsite()}
              disabled={loading}
              className="bg-white/[0.05] border border-white/10 rounded-lg px-6 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
              aria-label="Enter website URL"
            />
            <button
              onClick={analyzeWebsite}
              disabled={loading || !url.trim()}
              className={`bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white px-8 py-3 rounded-full font-bold text-lg hover:brightness-110 transition shadow-lg shadow-cyan-400/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Checking (up to 10 seconds)...' : 'Check Security'}
            </button>
          </div>
          {error && <p className="text-rose-400 mt-3" role="alert">{error}</p>}
        </div>

        {done && (
          <>
            <div className="flex items-center gap-6 mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradeColor[grade] || 'from-slate-500 to-slate-600'} flex items-center justify-center`}>
                <span className="font-display text-5xl font-extrabold text-slate-900">{grade}</span>
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-sm">Security headers grade</div>
                <div className="text-2xl font-bold text-slate-50 break-words">{domainInfo}</div>
                <div className="text-slate-400">
                  HTTPS: <span className={httpsStatus === 'Secure' ? 'text-emerald-300' : 'text-amber-300'}>{httpsStatus}</span>
                  {grade !== 'N/A' && <> &middot; Score {score}/100</>}
                </div>
              </div>
            </div>

            <ChecksList checks={checks} title="Detailed Checks" />

            {recommendations.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-50 mb-4">Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="bg-white/[0.06] rounded-lg p-4 text-slate-400">{rec}</div>
                  ))}
                </div>
              </div>
            )}
            {findings.length === 0 && recommendations.length === 0 && null}
          </>
        )}

        {!done && !loading && (
          <p className="text-slate-400 text-sm mt-4">
            Enter a website above to check its HTTPS certificate, security headers and more.
          </p>
        )}
      </div>
    </section>
  );
};

export default WebsiteSecurityInformation;
