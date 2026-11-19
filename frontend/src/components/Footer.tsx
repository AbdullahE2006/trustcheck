import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const cols = [
  {
    title: 'Tools',
    links: [
      ['/url-scanner', 'URL Scanner'],
      ['/scam-analyzer', 'Scam Analyzer'],
      ['/email-analyzer', 'Email Analyzer'],
      ['/password-checker', 'Password Checker'],
      ['/website-security', 'Website Security'],
    ],
  },
  {
    title: 'Learn',
    links: [
      ['/cyber-academy', 'Cyber Academy'],
      ['/security-news', 'Security News'],
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-white/10 bg-black/20 mt-8">
    <div className="max-w-7xl mx-auto px-6 py-14">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </span>
            <span className="font-display text-xl font-bold text-white">TrustCheck</span>
          </div>
          <p className="text-slate-400 max-w-sm">
            Free tools that help you spot scams, phishing and risky links before they cause trouble.
          </p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display font-semibold text-white mb-4">{c.title}</h4>
            <ul className="space-y-2">
              {c.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-cyan-300 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="pt-8 border-t border-white/10 text-sm text-slate-500">
        TrustCheck results are indicators, not a guarantee. Always use your own judgement.
      </p>
    </div>
  </footer>
);

export default Footer;
