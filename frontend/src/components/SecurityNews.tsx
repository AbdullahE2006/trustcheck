import React from 'react';
import { Shield, AlertCircle, Newspaper, Mail, Zap } from 'lucide-react';

const SecurityNews = () => {
  const alerts = [
    {
      id: '1',
      title: 'New Phishing Campaign Targeting Delivery Services',
      date: 'Jan 16, 2024',
      severity: 'High',
      description: 'Sophisticated phishing emails impersonating delivery services are circulating. Do not click links in unsolicited delivery notifications.',
    },
    {
      id: '2',
      title: 'SMS Scam: Fake Bank Verification Texts',
      date: 'Jan 15, 2024',
      severity: 'High',
      description: 'Scammers sending texts claiming to be from banks, requesting OTP verification. Banks never ask for OTP via SMS.',
    },
    {
      id: '3',
      title: 'Malware Distribution via Fake Software Updates',
      date: 'Jan 14, 2024',
      severity: 'Medium',
      description: 'Malware being distributed through fake Adobe Flash and browser update prompts. Always download from official sources.',
    },
    {
      id: '4',
      title: 'QR Code Scams on Public Posters',
      date: 'Jan 13, 2024',
      severity: 'Medium',
      description: 'Criminals placing QR codes on public posters leading to malicious sites. Verify QR code destinations before scanning.',
    },
    {
      id: '5',
      title: 'Romance Scam Awareness',
      date: 'Jan 12, 2024',
      severity: 'High',
      description: 'Increase in romance scams on dating platforms. Never send money to someone you have not met in person.',
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-10 h-10 text-cyan-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Cybersecurity Alerts</h2>
              <p className="text-slate-400 mb-4">Latest security alerts and scam warnings</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white/[0.06] rounded-xl p-6 border border-white/10 hover:border-cyan-400 transition-colors"
              style={{ borderLeftColor: alert.severity === 'High' ? '00FF88' : '00BFFF', borderWidth: '3px' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[{alert.severity === 'High' ? 'EF233C' : 'F6E05E'}]/20 flex items-center justify-center mt-1">
                  {alert.severity === 'High' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Newspaper className="w-4 h-4 text-yellow-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-50 mb-1">{alert.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{alert.description}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>{alert.date}</span>
                <span>{alert.severity} severity</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityNews;