import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Lock, Link2 } from 'lucide-react';

const Hero = () => {
  // ring: circumference 2*PI*60 = 377; score 87 -> offset 377 * (1 - 0.87)
  const offset = Math.round(377 * (1 - 0.87));

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 mb-7">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Free tools. No sign-up. Nothing stored.
          </span>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6">
            <span className="text-white">Check it</span>
            <br />
            <span className="gradient-text">before you click it.</span>
          </h1>

          <p className="text-lg text-slate-300/90 mb-9 max-w-xl leading-relaxed">
            Paste a link, a message, an email or a password and TrustCheck tells you
            what looks suspicious and what to do next, in plain language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/url-scanner"
              className="inline-flex justify-center rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-fuchsia-500/30 hover:brightness-110 transition"
            >
              Scan a link
            </Link>
            <a
              href="#tools"
              className="inline-flex justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-lg font-bold text-white hover:bg-white/10 transition"
            >
              See all tools
            </a>
          </div>
        </div>

        {/* demo result card */}
        <div className="relative float-slow">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 blur-2xl" />
          <div className="relative rounded-3xl border border-white/15 bg-[#12122e]/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-6">
              <Link2 className="w-5 h-5 text-cyan-300 shrink-0" />
              <span className="truncate text-slate-200 text-sm md:text-base">
                http://paypa1-secure-login.xyz/verify
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
                  <circle
                    cx="70" cy="70" r="60" fill="none" stroke="url(#ringGrad)" strokeWidth="12"
                    strokeLinecap="round" strokeDasharray="377"
                    className="ring-anim"
                    style={{ ['--ring-offset' as string]: offset, strokeDashoffset: offset }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-bold text-white">87</span>
                  <span className="text-xs text-rose-300">High risk</span>
                </div>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Looks like a fake PayPal
                </li>
                <li className="flex items-center gap-2 text-rose-300">
                  <Lock className="w-4 h-4 shrink-0" /> No HTTPS encryption
                </li>
                <li className="flex items-center gap-2 text-violet-300">
                  <Shield className="w-4 h-4 shrink-0" /> Risky .xyz domain
                </li>
              </ul>
            </div>
            <p className="mt-6 text-xs text-slate-500">Example result for illustration.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
