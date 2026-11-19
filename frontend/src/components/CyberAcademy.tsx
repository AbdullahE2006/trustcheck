import React from 'react';
import { Shield, Lock, Zap, Users, Phone, Globe, Mail } from 'lucide-react';

const CyberAcademy = () => {
  const categories = [
    {
      id: '1',
      title: 'Cybersecurity Fundamentals',
      icon: Shield,
      color: '#a78bfa',
      lessons: [
        'What is Cybersecurity?',
        'The CIA Triad (Confidentiality, Integrity, Availability)',
        'Understanding Threat Actors',
        'Basic Security Hygiene',
      ],
    },
    {
      id: '2',
      title: 'Phishing Awareness',
      icon: Mail,
      color: '#22d3ee',
      lessons: [
        'How Phishing Works',
        'Identifying Phishing Emails',
        'Smishing (SMS Phishing)',
        'Vishing (Voice Phishing)',
      ],
    },
    {
      id: '3',
      title: 'Password Security',
      icon: Lock,
      color: '#f472b6',
      lessons: [
        'Creating Strong Passwords',
        'Password Managers',
        'Two-Factor Authentication',
        'Password Reuse Dangers',
      ],
    },
    {
      id: '4',
      title: 'Network Security',
      icon: Zap,
      color: '#fbbf24',
      lessons: [
        'Understanding Wi-Fi Security',
        'VPN Basics',
        'Recognizing Unsecured Networks',
        'Firewall Fundamentals',
      ],
    },
    {
      id: '5',
      title: 'Malware Awareness',
      icon: Zap,
      color: '#34d399',
      lessons: [
        'Types of Malware',
        'How Malware Infects',
        'Ransomware Prevention',
        'Antivirus Tools',
      ],
    },
    {
      id: '6',
      title: 'Social Engineering',
      icon: Users,
      color: '#38bdf8',
      lessons: [
        'Manipulation Techniques',
        'Pretexting',
        'Baiting and Quid Pro Quo',
        'Defense Strategies',
      ],
    },
    {
      id: '7',
      title: 'Online Privacy',
      icon: Globe,
      color: '#fb7185',
      lessons: [
        'Data Collection Practices',
        'Browser Privacy Settings',
        'Tracking Prevention',
        'Personal Information Protection',
      ],
    },
    {
      id: '8',
      title: 'Mobile Security',
      icon: Phone,
      color: '#fb923c',
      lessons: [
        'Securing Mobile Devices',
        'App Permissions',
        'Mobile Banking Safety',
        'Lost Device Recovery',
      ],
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-10 h-10 text-cyan-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-50 mb-2">Cybersecurity Learning Center</h2>
              <p className="text-slate-400 mb-4">Beginner-friendly lessons to help you stay safe online</p>
              <p className="text-sm text-slate-400">
                Support English initially, designed for future Sinhala language support
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white/[0.06] rounded-2xl p-6 border border-white/10 hover:border-cyan-400 transition-all hover:shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: category.color + '33', color: category.color }}>
                <category.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-50 mb-3">{category.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2">
                {category.lessons.length} lessons available
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <ul className="text-slate-400 space-y-1 text-sm line-clamp-3">
                  {category.lessons.map((lesson) => (
                    <li key={lesson}>
                      <span className="font-medium text-slate-50">{lesson}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CyberAcademy;