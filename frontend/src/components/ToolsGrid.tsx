import { Link } from 'react-router-dom';
import { Link2, MessageSquareWarning, Mail, KeyRound, Globe, GraduationCap, Newspaper } from 'lucide-react';

const tools = [
  { to: '/url-scanner', icon: Link2, title: 'URL Scanner', text: 'Is this link safe to open? Spot fake and shortened links.', grad: 'from-cyan-400/30', tile: 'bg-cyan-400/20 text-cyan-300' },
  { to: '/scam-analyzer', icon: MessageSquareWarning, title: 'Scam Analyzer', text: 'Paste an SMS or chat message and see the scam signs.', grad: 'from-pink-400/30', tile: 'bg-pink-400/20 text-pink-300' },
  { to: '/email-analyzer', icon: Mail, title: 'Email Analyzer', text: 'Check suspicious emails for phishing tricks.', grad: 'from-amber-400/30', tile: 'bg-amber-400/20 text-amber-300' },
  { to: '/password-checker', icon: KeyRound, title: 'Password Checker', text: 'See how strong your password really is.', grad: 'from-violet-400/30', tile: 'bg-violet-400/20 text-violet-300' },
  { to: '/website-security', icon: Globe, title: 'Website Security', text: 'Quick HTTPS and domain check for any website.', grad: 'from-emerald-400/30', tile: 'bg-emerald-400/20 text-emerald-300' },
  { to: '/cyber-academy', icon: GraduationCap, title: 'Cyber Academy', text: 'Short lessons to stay safe online.', grad: 'from-sky-400/30', tile: 'bg-sky-400/20 text-sky-300' },
  { to: '/security-news', icon: Newspaper, title: 'Security News', text: 'Latest scam alerts and warnings.', grad: 'from-rose-400/30', tile: 'bg-rose-400/20 text-rose-300' },
];

const ToolsGrid = () => (
  <section id="tools" className="pb-24 scroll-mt-24">
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Pick a tool</h2>
      <p className="text-slate-400 mb-10">Everything you need to stay safe, in one place.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map(({ to, icon: Icon, title, text, grad, tile }) => (
          <Link
            key={to}
            to={to}
            className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${grad} to-white/[0.02] p-6 hover:border-white/30 hover:-translate-y-1 transition`}
          >
            <span className={`inline-flex w-12 h-12 rounded-xl items-center justify-center mb-5 ${tile}`}>
              <Icon className="w-6 h-6" />
            </span>
            <h3 className="font-display text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-slate-300/80 text-sm leading-relaxed">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default ToolsGrid;
