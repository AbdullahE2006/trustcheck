import React, { useState } from 'react';
import { Shield, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';

const PasswordStrengthChecker = () => {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<'Weak' | 'Fair' | 'Good' | 'Strong'>('Weak');
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(0);
  const [diversity, setDiversity] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [crackingCategory, setCrackingCategory] = useState<string>('');
  const [breach, setBreach] = useState<{ state: 'idle' | 'loading' | 'safe' | 'pwned' | 'error'; count?: number }>({ state: 'idle' });

  // k-anonymity: only the first 5 characters of the SHA-1 hash are sent. The password never leaves the browser.
  const checkBreach = async () => {
    if (!password) return;
    setBreach({ state: 'loading' });
    try {
      const data = new TextEncoder().encode(password);
      const digest = await crypto.subtle.digest('SHA-1', data);
      const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const prefix = hex.slice(0, 5);
      const suffix = hex.slice(5);
      const res = await fetch(`/api/v1/scans/breach-range/${prefix}`);
      if (!res.ok) throw new Error('lookup failed');
      const text = await res.text();
      const line = text.split('\n').map((l) => l.trim()).find((l) => l.startsWith(suffix + ':'));
      const count = line ? parseInt(line.split(':')[1], 10) : 0;
      setBreach(count > 0 ? { state: 'pwned', count } : { state: 'safe' });
    } catch {
      setBreach({ state: 'error' });
    }
  };

  const commonPasswords = ['password', '123456', '12345678', 'qwerty', '12345', 'admin', 'abc123'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setBreach({ state: 'idle' });
    
    // Analyze strength
    analyzePassword(value);
  };

  const analyzePassword = (pwd: string) => {
    let score = 0;
    let strength: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
    let pwdLength = pwd.length;
    const warnings: string[] = [];
    let diversity: 'Low' | 'Medium' | 'High' = 'Low';

    // Length analysis
    if (pwdLength >= 12) {
      score += 30;
      diversity = 'High';
    } else if (pwdLength >= 8) {
      score += 20;
      diversity = 'Medium';
    } else if (pwdLength >= 6) {
      score += 10;
      diversity = 'Low';
      warnings.push('Password is too short - recommend at least 8 characters');
    } else {
      warnings.push('Password is very short - recommend at least 6 characters');
    }

    // Character diversity
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const charTypes = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

    if (charTypes >= 4) {
      score += 25;
      diversity = 'High';
    } else if (charTypes >= 3) {
      score += 15;
      diversity = 'Medium';
    } else if (charTypes >= 2) {
      score += 10;
      diversity = 'Low';
    }

    // Common password check
    const lowerPwd = pwd.toLowerCase();
    if (commonPasswords.some(cp => lowerPwd.includes(cp))) {
      score = 0;
      warnings.push('This is a commonly used password - choose a unique combination');
    }

    // Bonus for length beyond 12
    if (pwdLength > 12) {
      score += 5;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine strength level
    if (score >= 80) {
      strength = 'Strong';
    } else if (score >= 60) {
      strength = 'Good';
    } else if (score >= 40) {
      strength = 'Fair';
    } else {
      strength = 'Weak';
    }

    setScore(score);
    setLength(pwdLength);
    setDiversity(diversity);
    setWarnings(warnings);

    // Estimated cracking difficulty category
    let crackingCategory = 'Unknown';
    if (score >= 80) {
      crackingCategory = 'Would take years to crack with modern hardware';
    } else if (score >= 60) {
      crackingCategory = 'Would take days to crack with modern hardware';
    } else if (score >= 40) {
      crackingCategory = 'Could be cracked in hours with modern hardware';
    } else if (score > 0) {
      crackingCategory = 'Likely to be cracked quickly';
    } else {
      crackingCategory = 'Very weak - easily cracked';
    }

    setCrackingCategory(crackingCategory);
  };

  function getProgressColor(strength: string) {
    const colors: Record<string, string> = {
      Weak: 'text-amber-300',
      Fair: 'text-amber-300',
      Good: 'text-emerald-300',
      Strong: 'text-emerald-300',
    };
    return colors[strength] || 'text-slate-400';
  }

  function getDiversityColor(diversity: string) {
    const colors: Record<string, string> = {
      Low: 'text-amber-300',
      Medium: 'text-amber-300',
      High: 'text-emerald-300',
    };
    return colors[diversity] || 'text-slate-400';
  }

  function getCrackingColor(category: string) {
    const colors: Record<string, string> = {
      'Would take years': 'text-emerald-300',
      'Would take days': 'text-emerald-300',
      'Could be cracked': 'text-amber-300',
      'Likely to be': 'text-amber-300',
      'Very weak': 'text-amber-300',
    };
    return colors[category] || 'text-slate-400';
  }

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-start gap-4">
            <Lock className="w-10 h-10 text-cyan-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Password Strength Checker</h2>
              <p className="text-slate-400 mb-4">Enter a password to evaluate its strength (analysis happens locally in your browser)</p>
              <p className="text-sm text-slate-400">Your password is never transmitted or stored</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Password Input */}
            <div>
              <input
                type="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter password to analyze..."
                className="bg-white/[0.05] border border-white/10 rounded-lg px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
                aria-label="Enter password for strength analysis"
                required
              />
              <button
                type="button"
                onClick={checkBreach}
                disabled={!password || breach.state === 'loading'}
                className="mt-4 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                {breach.state === 'loading' ? 'Checking...' : 'Check if this password was leaked'}
              </button>
              {breach.state === 'pwned' && (
                <p className="mt-3 text-rose-400 font-semibold">
                  This password appeared in data breaches {breach.count?.toLocaleString()} times. Do not use it.
                </p>
              )}
              {breach.state === 'safe' && (
                <p className="mt-3 text-emerald-300 font-semibold">
                  Not found in known data breaches. (That does not mean it is strong, see the score below.)
                </p>
              )}
              {breach.state === 'error' && (
                <p className="mt-3 text-amber-300">Could not reach the breach database right now. Try again later.</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Only the first 5 characters of a one-way hash are sent, never your password.
              </p>
            </div>

            {/* Strength Visualization */}
            <div>
              <h3 className="text-xl font-bold text-slate-50 mb-4">Strength Score</h3>
              
              {/* Progress bar background */}
              <div className="bg-white/[0.06] rounded-full h-8 mb-4">
                <div
                  className={getProgressColor(strength) + ' h-full rounded-full transition-width duration-300'}
                  style={{ width: `${score}%` }}
                ></div>
              </div>

              {/* Score display */}
              <div className="flex justify-between text-sm mb-2">
                <span>{score}/100</span>
                <span>{strength}</span>
              </div>

              {/* Diversity badge */}
              <div className="mb-3">
                <span className={getDiversityColor(diversity)}>
                  {diversity}
                </span>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-white/[0.06] rounded-lg p-4 mb-4">
                <ul className="text-slate-400 space-y-2 text-sm">
                  {warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0 mt-1.5"></div>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cracking category */}
            {crackingCategory && (
              <div>
                <div className="text-xs text-slate-400 mb-2">Cracking Difficulty</div>
                <div className={getCrackingColor(crackingCategory)} style={{ fontSize: '0.875rem' }}>
                  {crackingCategory}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <h3 className="text-xl font-bold text-slate-50 mb-4">Password Guidelines</h3>
          <div className="grid grid-cols-2 gap-4 text-slate-400">
            <div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>At least 8 characters long</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Mix uppercase and lowercase letters</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Include numbers</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Include special characters</span>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Avoid common words and patterns</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Don't reuse passwords</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full flex-shrink-0 mt-1"></div>
                <span>Update passwords regularly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PasswordStrengthChecker;