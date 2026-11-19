import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export interface Check {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail: string;
}

const style = {
  pass: { icon: CheckCircle2, cls: 'text-emerald-300', ring: 'border-emerald-400/20' },
  warn: { icon: AlertTriangle, cls: 'text-amber-300', ring: 'border-amber-400/20' },
  fail: { icon: XCircle, cls: 'text-rose-400', ring: 'border-rose-400/30' },
  info: { icon: Info, cls: 'text-sky-300', ring: 'border-sky-400/20' },
} as const;

const ChecksList = ({ checks, title }: { checks: Check[]; title: string }) => {
  if (!checks.length) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-slate-50 mb-4">{title}</h3>
      <div className="space-y-3">
        {checks.map((c, i) => {
          const { icon: Icon, cls, ring } = style[c.status] || style.info;
          return (
            <div key={i} className={`bg-white/[0.06] border ${ring} rounded-lg p-4 flex items-start gap-3`}>
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cls}`} />
              <div className="min-w-0">
                <div className="font-semibold text-slate-50">{c.name}</div>
                <div className="text-slate-400 text-sm break-words">{c.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChecksList;
