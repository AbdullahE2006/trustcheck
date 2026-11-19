import { Gift, UserX, HardDrive, Zap } from 'lucide-react';

const items = [
  { icon: Gift, title: '100% free', text: 'No subscriptions', from: 'from-emerald-400/25', tint: 'text-emerald-300' },
  { icon: UserX, title: 'No sign-up', text: 'Use it right away', from: 'from-sky-400/25', tint: 'text-sky-300' },
  { icon: HardDrive, title: 'Nothing stored', text: 'Scans stay on your PC', from: 'from-fuchsia-400/25', tint: 'text-fuchsia-300' },
  { icon: Zap, title: 'Instant results', text: 'Answers in seconds', from: 'from-amber-400/25', tint: 'text-amber-300' },
];

const StatsCards = () => (
  <section className="pb-20">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(({ icon: Icon, title, text, from, tint }) => (
        <div
          key={title}
          className={`rounded-2xl border border-white/10 bg-gradient-to-br ${from} to-transparent p-6`}
        >
          <Icon className={`w-7 h-7 mb-4 ${tint}`} />
          <div className="font-display text-xl font-bold text-white">{title}</div>
          <div className="text-sm text-slate-400 mt-1">{text}</div>
        </div>
      ))}
    </div>
  </section>
);

export default StatsCards;
