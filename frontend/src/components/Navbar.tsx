import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/url-scanner', label: 'URL Scanner' },
  { to: '/scam-analyzer', label: 'Scam Analyzer' },
  { to: '/email-analyzer', label: 'Email Analyzer' },
  { to: '/password-checker', label: 'Passwords' },
  { to: '/cyber-academy', label: 'Academy' },
  { to: '/security-news', label: 'News' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1f]/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Shield className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-xl font-bold text-white">TrustCheck</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-white/10"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#0a0a1f]/95 backdrop-blur-xl px-6 py-3 flex flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `py-3 font-medium border-b border-white/5 last:border-0 ${
                  isActive ? 'text-cyan-300' : 'text-slate-200'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
