import { Request, Response } from 'express';
import {
  probeUrl,
  domainAge,
  analyzeHeaders,
  emailAuthRecords,
  pwnedRange,
  withDeadline,
  ProbeResult,
} from '../services/probe.js';

export interface Check {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  detail: string;
}

// ============ A. URL SECURITY SCANNER ============

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'cutt.ly', 'rebrand.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 'short.link',
]);

const RISKY_TLDS = [
  'xyz', 'top', 'club', 'gq', 'ml', 'tk', 'cf', 'ga', 'work', 'click',
  'link', 'zip', 'mov', 'icu', 'cyou', 'buzz', 'rest', 'monster', 'sbs',
];

// Piracy / torrent / cracked-software sites: very common sources of malware,
// fake download buttons and scam pop-ups.
const PIRACY_WORDS = [
  'piratebay', 'piratesbay', 'thepiratebay', 'torrent', '1337x', 'rarbg',
  'yts', 'limetorrents', 'kickass', 'fitgirl', 'nyaa', 'fmovies', '123movies',
  'putlocker', 'solarmovie', 'gomovies', 'yesmovies', 'warez', 'keygen',
  'cracked', 'nulled', 'crack4', 'getintopc', 'igetintopc', 'haxnode',
  'freemoviesonline', 'watchfree', 'movies4u', 'moviesda', 'tamilrockers',
  'tamilyogi', 'isaimini', 'filmyzilla', 'hdhub4u',
];

// brand -> official registrable domains
const BRANDS: Record<string, string[]> = {
  paypal: ['paypal.com'],
  google: ['google.com', 'google.lk', 'googleapis.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  whatsapp: ['whatsapp.com'],
  amazon: ['amazon.com', 'amazon.co.uk'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com'],
  netflix: ['netflix.com'],
  youtube: ['youtube.com'],
  dhl: ['dhl.com'],
  binance: ['binance.com'],
  telegram: ['telegram.org'],
  tiktok: ['tiktok.com'],
};

const registrableDomain = (hostname: string) => {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  const secondLevel = ['co', 'com', 'org', 'net', 'gov', 'ac', 'edu'];
  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];
  if (last.length === 2 && secondLevel.includes(prev)) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
};

const normalizeLeet = (text: string) =>
  text.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's').replace(/@/g, 'a');

// Domain reputation checks (piracy, risky TLD, brand impersonation)
const reputationChecks = (hostname: string, domain: string, tld: string, isIp: boolean) => {
  let score = 0;
  const findings: string[] = [];
  const recs: string[] = [];

  const compactHost = hostname.replace(/[^a-z0-9]/g, '');
  const piracyHit = PIRACY_WORDS.find((w) => compactHost.includes(w));
  if (piracyHit) {
    score += 60;
    findings.push('Piracy / torrent / cracked-software site. These sites often carry malware, fake download buttons, scam pop-ups and may be illegal to use');
    recs.push('Avoid downloading files from this site. Use official, legal sources instead');
    recs.push('If you already visited it, do not install anything it offered and run an antivirus scan');
  }

  if (!isIp && RISKY_TLDS.includes(tld)) {
    score += 20;
    findings.push(`Domain ending .${tld} is very common on scam and spam sites`);
  }

  const leet = normalizeLeet(hostname);
  for (const [brand, official] of Object.entries(BRANDS)) {
    if (leet.includes(brand) && !official.includes(domain) && !official.some((d) => hostname.endsWith('.' + d))) {
      score += 45;
      findings.push(`Looks like it is imitating ${brand} but is not the official ${official[0]} website`);
      recs.push(`Go to ${official[0]} by typing it yourself instead of using this link`);
      break;
    }
  }
  return { score, findings, recs };
};

export const scanUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required',
        riskScore: 0,
        riskClassification: 'No URL provided',
        findings: [],
        recommendations: ['Please enter a URL to scan'],
        scanTimestamp: new Date().toISOString(),
      });
    }

    const findings: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    let normalizedUrl = url.trim();
    const hadProtocol = /^https?:\/\//i.test(normalizedUrl);
    if (!hadProtocol) normalizedUrl = 'https://' + normalizedUrl;

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
      if (!parsed.hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
        throw new Error('no dot');
      }
    } catch {
      return res.status(200).json({
        status: 'success',
        riskScore: 30,
        riskClassification: 'Medium Risk',
        findings: ['This does not look like a valid web address'],
        recommendations: ['Check the spelling and enter a full address such as https://example.com'],
        scanTimestamp: new Date().toISOString(),
      });
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const domain = registrableDomain(hostname);
    const tld = hostname.split('.').pop() || '';
    const lowerUrl = normalizedUrl.toLowerCase();

    // 1. Encryption
    if (hadProtocol && parsed.protocol === 'http:') {
      riskScore += 15;
      findings.push('Connection is not encrypted (HTTP, not HTTPS)');
      recommendations.push('Never enter passwords or card details on a site without HTTPS');
    } else if (parsed.protocol === 'https:') {
      findings.push(hadProtocol ? 'Uses HTTPS encryption' : 'No protocol typed, checked as https://');
    }

    // 2. Domain reputation (piracy, risky ending, brand impersonation)
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const rep = reputationChecks(hostname, domain, tld, isIp);
    riskScore += rep.score;
    findings.push(...rep.findings);
    recommendations.push(...rep.recs);

    // 3. IP address instead of a domain
    if (isIp) {
      riskScore += 30;
      findings.push('Uses a raw IP address instead of a domain name');
      recommendations.push('Real companies almost never ask you to log in on an IP address');
    }

    // 4. URL shorteners
    if (URL_SHORTENERS.has(domain)) {
      riskScore += 30;
      findings.push(`Shortened link (${domain}) hides the real destination`);
      recommendations.push('Use a link expander to preview where the short link really goes');
    }

    // 7. Other structural red flags
    if (!isIp && hostname.split('.').length > 4) {
      riskScore += 10;
      findings.push('Unusually many subdomains');
    }
    if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
      riskScore += 25;
      findings.push('Uses look-alike (punycode) characters that can imitate a real site');
    }
    if (parsed.username || lowerUrl.includes('@')) {
      riskScore += 25;
      findings.push('Contains an @ sign or login info in the address, a common trick to hide the real site');
    }
    if ((hostname.match(/-/g) || []).length >= 3) {
      riskScore += 10;
      findings.push('Many hyphens in the domain name');
    }
    if (parsed.port && !['80', '443'].includes(parsed.port)) {
      riskScore += 10;
      findings.push(`Uses an unusual port (${parsed.port})`);
    }
    if (normalizedUrl.length > 120) {
      riskScore += 10;
      findings.push('Very long address');
    }
    const keyword = ['login', 'signin', 'verify', 'secure', 'account', 'update', 'password', 'wallet', 'bank']
      .find((k) => (hostname + parsed.pathname).toLowerCase().includes(k));
    if (keyword) {
      riskScore += 10;
      findings.push(`Contains the word "${keyword}", often used in phishing links`);
    }

    // 8. Live checks: certificate, redirects, domain age (run in parallel, hard time limit)
    const checks: Check[] = [];
    if (!isIp) {
      const [probe, age] = await Promise.all([
        withDeadline<ProbeResult>(probeUrl(normalizedUrl), 7000, { ok: false, error: 'TIMEOUT', chain: [] }),
        withDeadline(domainAge(domain), 5000, null),
      ]);

      // Domain age
      if (age) {
        if (age.ageDays < 7) {
          riskScore += 40;
          checks.push({ name: 'Domain age', status: 'fail', detail: `Registered only ${age.ageDays} day(s) ago (${age.createdAt}). Brand-new domains are a major phishing sign` });
        } else if (age.ageDays < 30) {
          riskScore += 30;
          checks.push({ name: 'Domain age', status: 'fail', detail: `Registered ${age.ageDays} days ago (${age.createdAt}). Very new domain` });
        } else if (age.ageDays < 180) {
          riskScore += 10;
          checks.push({ name: 'Domain age', status: 'warn', detail: `Registered ${Math.floor(age.ageDays / 30)} months ago (${age.createdAt}). Fairly new domain` });
        } else {
          const years = (age.ageDays / 365).toFixed(1);
          checks.push({ name: 'Domain age', status: 'pass', detail: `Registered ${years} years ago (${age.createdAt})` });
        }
      } else {
        checks.push({ name: 'Domain age', status: 'info', detail: 'Registration date not available for this domain' });
      }

      // Reachability + certificate + redirects
      if (!probe.ok) {
        if (probe.error === 'BLOCKED') {
          riskScore += 30;
          checks.push({ name: 'Connection', status: 'fail', detail: 'This address points to a private/internal network. It was not contacted' });
        } else if (probe.error === 'DNS_NOT_FOUND') {
          checks.push({ name: 'Connection', status: 'warn', detail: 'This domain does not exist (or its DNS is offline)' });
        } else {
          checks.push({ name: 'Connection', status: 'info', detail: 'Could not reach the site for a live check (offline, slow, or blocking scanners)' });
        }
      } else {
        checks.push({ name: 'Connection', status: 'pass', detail: `Site responded (HTTP ${probe.finalStatus})` });

        const cert = probe.firstCert;
        if (cert) {
          if (!cert.authorized) {
            riskScore += 40;
            checks.push({ name: 'SSL certificate', status: 'fail', detail: `Certificate is NOT trusted (${cert.authError || 'unknown reason'}). Do not enter any information here` });
          } else if (cert.daysLeft !== null && cert.daysLeft < 14) {
            riskScore += 5;
            checks.push({ name: 'SSL certificate', status: 'warn', detail: `Valid, but expires in ${cert.daysLeft} day(s). Issued by ${cert.issuer || 'unknown'}` });
          } else {
            checks.push({ name: 'SSL certificate', status: 'pass', detail: `Valid certificate issued by ${cert.issuer || 'unknown'}${cert.daysLeft !== null ? `, expires in ${cert.daysLeft} days` : ''}${cert.protocol ? ` (${cert.protocol})` : ''}` });
          }
        } else if (parsed.protocol === 'http:') {
          checks.push({ name: 'SSL certificate', status: 'fail', detail: 'No encryption. This site is served over plain HTTP' });
        }

        // Redirects
        if (probe.chain.length > 1 && probe.finalUrl) {
          let finalHost = '';
          try { finalHost = new URL(probe.finalUrl).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* ignore */ }
          const finalDomain = registrableDomain(finalHost);
          const hops = probe.chain.length - 1;
          if (finalDomain && finalDomain !== domain) {
            riskScore += 10;
            checks.push({ name: 'Redirects', status: 'warn', detail: `Redirects ${hops} time(s) to a different site: ${finalHost}` });

            const finalIsIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(finalHost);
            const finalRep = reputationChecks(finalHost, finalDomain, finalHost.split('.').pop() || '', finalIsIp);
            if (finalRep.score > 0) {
              riskScore += finalRep.score;
              findings.push(...finalRep.findings.map((f) => `Final destination (${finalHost}): ${f}`));
              recommendations.push(...finalRep.recs);
            }
          } else {
            checks.push({ name: 'Redirects', status: 'info', detail: `Redirects ${hops} time(s) within the same site` });
          }
          if (hops > 3) {
            riskScore += 10;
            findings.push('Long redirect chain, often used to hide the real destination');
          }
          if (probe.downgradedToHttp) {
            riskScore += 10;
            findings.push('Redirects from a secure page to an unencrypted (HTTP) page');
          }
        } else {
          checks.push({ name: 'Redirects', status: 'pass', detail: 'No redirects. The link goes straight to the site' });
        }
      }
    }

    riskScore = Math.min(riskScore, 100);

    let riskClassification = 'Low Risk';
    if (riskScore >= 60) riskClassification = 'High Risk';
    else if (riskScore >= 30) riskClassification = 'Medium Risk';

    if (riskScore >= 60) recommendations.unshift('Do not open this link or enter any information on it');
    else if (riskScore >= 30) recommendations.unshift('Be careful. Double-check this link before you use it');
    else recommendations.unshift('No obvious red flags in the link itself, but stay alert');

    recommendations.push('Note: TrustCheck combines pattern checks with live certificate, redirect and domain-age checks. It does not use malware blocklists yet, so a clean result is not a guarantee');

    return res.status(200).json({
      status: 'success',
      riskScore,
      riskClassification,
      findings,
      recommendations,
      checks,
      scanTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('URL scan error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error scanning URL',
      riskScore: 0,
      riskClassification: 'Error',
      findings: ['An error occurred during scanning'],
      recommendations: ['Please try again with a valid URL'],
      scanTimestamp: new Date().toISOString(),
    });
  }
};

// ============ B. SCAM MESSAGE ANALYZER ============

export const analyzeScamMessage = (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required',
        riskScore: 0,
        scamIndicators: [],
        explanation: '',
        safetyRecommendations: [],
      });
    }

    const indicators: string[] = [];
    let riskScore = 0;
    let explanation = '';
    const safetyRecommendations: string[] = [];

    const lowerMessage = message.toLowerCase();

    // Urgent payment requests
    const paymentKeywords = ['payment', 'transfer', 'wire', 'bitcoin', 'crypto', 'pay', 'payment'];
    const hasUrgentPayment = paymentKeywords.some(kw => lowerMessage.includes(kw));
    if (hasUrgentPayment) {
      riskScore += 25;
      indicators.push('Urgent payment request detected');
    }

    // Suspicious links
    const urlPattern = /https?:\/\/\S+|www\.\S+/i;
    const hasLinks = urlPattern.test(message);
    if (hasLinks) {
      riskScore += 20;
      indicators.push('Suspicious links detected in message');
    }

    // OTP requests
    const otpKeywords = ['otp', 'one-time password', 'code', 'verification code'];
    const hasOtpRequest = otpKeywords.some(kw => lowerMessage.includes(kw));
    if (hasOtpRequest) {
      riskScore += 30;
      indicators.push('OTP/verification code request detected - classic phishing tactic');
    }

    // Fake prize claims
    const prizeKeywords = ['prize', 'winner', 'won', ' lottery', 'claim', 'earned'];
    const hasPrizeClaim = prizeKeywords.some(kw => lowerMessage.includes(kw));
    if (hasPrizeClaim) {
      riskScore += 25;
      indicators.push('Fake prize or lottery claim detected');
    }

    // Financial scams
    const financialKeywords = ['bank', 'account', 'fund', 'inheritance', 'transfer', 'refund'];
    const hasFinancial = financialKeywords.some(kw => lowerMessage.includes(kw));
    if (hasFinancial) {
      riskScore += 15;
      indicators.push('Financial-related language detected');
    }

    // Impersonation language
    const impersonationKeywords = ['amazon', 'netflix', 'apple', 'google', 'microsoft', 'support', 'admin'];
    const hasImpersonation = impersonationKeywords.some(kw => lowerMessage.includes(kw));
    if (hasImpersonation) {
      riskScore += 15;
      indicators.push('Organization impersonation language detected');
    }

    // Suspicious contact information
    const phonePattern = /\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b/;
    const hasPhone = phonePattern.test(message);
    if (hasPhone) {
      riskScore += 10;
      indicators.push('Suspicious contact phone number detected');
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine classification
    let classification = 'Safe';
    if (riskScore >= 70) classification = 'Highly Likely Scam';
    else if (riskScore >= 40) classification = 'Potential Scam';
    else if (riskScore > 0) classification = 'Suspicious';

    // Build explanation
    if (riskScore >= 70) {
      explanation = `This message shows multiple red flags characteristic of scams. Risk score: ${riskScore}/100. ${indicators.join('. ')}. This message should be deleted and not interacted with.`;
    } else if (riskScore >= 40) {
      explanation = `This message has some concerning elements. Risk score: ${riskScore}/100. ${indicators.length > 0 ? indicators.join('. ') : 'Please review the message carefully.'} Do not click any links or provide personal information.`;
    } else if (riskScore > 0) {
      explanation = `This message has some subtle indicators. Risk score: ${riskScore}/100. ${indicators.join('. ') || 'Review the message for any unusual requests.'}`;
    } else {
      explanation = 'No significant scam indicators detected in this message. However, always remain cautious with unsolicited messages.';
      if (!indicators.length) riskScore = 0;
    }

    // Safety recommendations
    if (hasOtpRequest) {
      safetyRecommendations.push('Never share OTP codes or verification codes with anyone');
    }
    if (hasLinks) {
      safetyRecommendations.push('Do not click on links from unknown sources');
    }
    if (hasUrgentPayment) {
      safetyRecommendations.push('Verify payment requests through official channels');
    }
    if (hasPrizeClaim) {
      safetyRecommendations.push('Legitimate prizes do not require upfront payments');
    }
    if (riskScore >= 70) {
      safetyRecommendations.push('Delete the message and block the sender');
      safetyRecommendations.push('Report the message to the platform');
    }
    if (riskScore >= 40 && riskScore < 70) {
      safetyRecommendations.push('Contact the claimed organization directly through official website');
      safetyRecommendations.push('Do not provide any personal or financial information');
    }

    return res.status(200).json({
      status: 'success',
      riskScore,
      scamIndicators: indicators,
      explanation,
      safetyRecommendations,
    });
  } catch (error) {
    console.error('Scam message analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error analyzing message',
      riskScore: 0,
      scamIndicators: ['An error occurred during analysis'],
      explanation: 'An unexpected error occurred. Please try again with your message.',
      safetyRecommendations: ['Please try again later'],
    });
  }
};

// ============ C. EMAIL PHISHING ANALYZER ============

export const analyzeEmailPhishing = async (req: Request, res: Response) => {
  try {
    const { emailContent } = req.body;

    if (!emailContent) {
      return res.status(400).json({
        status: 'error',
        message: 'Email content is required',
        phishingIndicators: [],
        securityReport: '',
      });
    }

    const phishingIndicators: string[] = [];
    let riskScore = 0;
    let securityReport = '';

    const lowerContent = emailContent.toLowerCase();

    // Sender authentication (SPF / DMARC) for the From: address, if present
    let senderAuth: { domain: string; spf: boolean; dmarc: boolean; dmarcPolicy: string | null } | null = null;
    const fromMatch = String(emailContent).match(/^from:.*?<?[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})>?/im);
    if (fromMatch) {
      const senderDomain = fromMatch[1].toLowerCase();
      const rec = await withDeadline(emailAuthRecords(senderDomain), 4000, null);
      if (rec) {
        senderAuth = { domain: senderDomain, spf: !!rec.spf, dmarc: !!rec.dmarc, dmarcPolicy: rec.dmarcPolicy };
        if (!rec.spf) {
          riskScore += 15;
          phishingIndicators.push(`Sender domain ${senderDomain} has no SPF record, so anyone can fake emails from it`);
        }
        if (!rec.dmarc) {
          riskScore += 10;
          phishingIndicators.push(`Sender domain ${senderDomain} has no DMARC policy`);
        } else if (rec.dmarcPolicy === 'none') {
          phishingIndicators.push(`Sender domain ${senderDomain} has DMARC set to monitor only (p=none)`);
        }
      }
    }

    // Suspicious sender information
    const senderKeywords = ['support', 'security', 'admin', 'no-reply', 'verify'];
    const hasSuspiciousSender = senderKeywords.some(kw => lowerContent.includes(kw));
    if (hasSuspiciousSender) {
      riskScore += 15;
      phishingIndicators.push('Suspicious sender information');
    }

    // Urgent language
    const urgentKeywords = ['urgent', 'immediately', 'within 24 hours', 'action required', 'critical'];
    const hasUrgent = urgentKeywords.some(kw => lowerContent.includes(kw));
    if (hasUrgent) {
      riskScore += 20;
      phishingIndicators.push('Urgent language used to create panic');
    }

    // Fake account warnings
    const accountKeywords = ['your account will be suspended', 'account expired', 'verify your account'];
    const hasAccountWarning = accountKeywords.some(kw => lowerContent.includes(kw));
    if (hasAccountWarning) {
      riskScore += 20;
      phishingIndicators.push('Fake account warning');
    }

    // Password requests
    const passwordKeywords = ['password', 'login', 'credential', 'sign-in'];
    const hasPasswordRequest = passwordKeywords.some(kw => lowerContent.includes(kw));
    if (hasPasswordRequest) {
      riskScore += 30;
      phishingIndicators.push('Password request detected - phishing hallmark');
    }

    // Financial requests
    const financialKeywords = ['bank', 'payment', 'transfer', 'invoice', 'owe', 'payment'];
    const hasFinancial = financialKeywords.some(kw => lowerContent.includes(kw));
    if (hasFinancial) {
      riskScore += 15;
      phishingIndicators.push('Financial request detected');
    }

    // Suspicious URLs
    const urlPattern = /https?:\/\/\S+|www\.\S+/i;
    const hasUrls = urlPattern.test(emailContent);
    if (hasUrls) {
      riskScore += 20;
      phishingIndicators.push('Suspicious URLs in email');
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Build security report
    if (riskScore >= 70) {
      securityReport = `PHISHING ALERT - High confidence phishing attempt detected.\n\n`
        + `Risk Score: ${riskScore}/100\n`
        + `Indicators: ${phishingIndicators.join(', ')}\n\n`
        + `This email shows multiple phishing indicators and should NOT be interacted with.\n`
        + `Do not click any links, download attachments, or provide any personal information.\n`
        + `Delete the email and report it as phishing to your email provider.\n`;
    } else if (riskScore >= 40) {
      securityReport = `SUSPICIOUS EMAIL - Some phishing indicators detected.\n\n`
        + `Risk Score: ${riskScore}/100\n`
        + `Indicators: ${phishingIndicators.join(', ')}\n\n`
        + `This email contains some suspicious elements. Exercise caution and do not:\n`
        + `- Click on unknown links\n`
        + `- Download attachments\n`
        + `- Provide personal or financial information\n`
        + `Verify any requests through the official organization's website.\n`;
    } else if (riskScore > 0) {
      securityReport = `LOW RISK EMAIL - Minimal phishing indicators detected.\n\n`
        + `Risk Score: ${riskScore}/100\n`
        + `Indicators: ${phishingIndicators.join(', ') || 'None significant'}\n\n`
        + `This email appears relatively safe, but remain vigilant.\n`
        + `If you weren't expecting this email, verify the sender through official channels.\n`;
    } else {
      securityReport = `SAFE EMAIL - No significant phishing indicators detected.\n\n`
        + `Risk Score: 0/100\n`
        + `Indicators: None detected\n\n`
        + `This email appears legitimate. However, always exercise caution with unsolicited emails.\n`;
    }

    return res.status(200).json({
      status: 'success',
      riskScore,
      phishingIndicators,
      securityReport,
      senderAuth,
    });
  } catch (error) {
    console.error('Email phishing analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error analyzing email',
      riskScore: 0,
      phishingIndicators: ['An error occurred during analysis'],
      securityReport: 'An unexpected error occurred. Please try again with your email content.',
    });
  }
};

// ============ E. WEBSITE SECURITY INFORMATION ============

export const getWebsiteSecurityInfo = async (req: Request, res: Response) => {
  try {
    let target = String(req.body.url).trim();
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

    let parsed: URL;
    try {
      parsed = new URL(target);
      if (!parsed.hostname.includes('.')) throw new Error('bad host');
    } catch {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid website address' });
    }

    const hostname = parsed.hostname.toLowerCase();
    const domain = registrableDomain(hostname.replace(/^www\./, ''));

    const [probe, age] = await Promise.all([
      withDeadline<ProbeResult>(probeUrl(target), 8000, { ok: false, error: 'TIMEOUT', chain: [] }),
      withDeadline(domainAge(domain), 5000, null),
    ]);

    const checks: Check[] = [];
    const findings: string[] = [];
    const recommendations: string[] = [];
    let httpsStatus: 'Secure' | 'Not Secure' | 'Unknown' = 'Unknown';
    let headersStatus = 'Unknown';
    let grade = 'N/A';
    let score = 0;

    if (!probe.ok) {
      const msg =
        probe.error === 'BLOCKED' ? 'This address points to a private/internal network, so it was not contacted'
        : probe.error === 'DNS_NOT_FOUND' ? 'This domain does not exist (or its DNS is offline)'
        : probe.error === 'TIMEOUT' ? 'The site took too long to respond'
        : 'Could not connect to the site';
      checks.push({ name: 'Connection', status: 'fail', detail: msg });
      findings.push(msg);
      recommendations.push('Check the spelling of the address and try again');
    } else {
      checks.push({ name: 'Connection', status: 'pass', detail: `Site responded (HTTP ${probe.finalStatus})` });

      const finalIsHttps = !!probe.finalUrl && probe.finalUrl.startsWith('https://');
      httpsStatus = finalIsHttps && probe.firstCert?.authorized !== false ? 'Secure' : 'Not Secure';

      // Certificate
      const cert = probe.finalCert || probe.firstCert;
      if (cert) {
        if (!cert.authorized) {
          checks.push({ name: 'SSL certificate', status: 'fail', detail: `NOT trusted: ${cert.authError || 'unknown reason'}` });
          findings.push('The SSL certificate is not trusted by browsers');
          recommendations.push('Do not enter passwords or personal information on this site');
        } else {
          const soon = cert.daysLeft !== null && cert.daysLeft < 14;
          checks.push({
            name: 'SSL certificate',
            status: soon ? 'warn' : 'pass',
            detail: `Issued by ${cert.issuer || 'unknown'} to ${cert.subject || hostname}${cert.daysLeft !== null ? `, expires in ${cert.daysLeft} days` : ''}`,
          });
          if (cert.protocol) {
            const old = /TLSv1(\.0|\.1)?$/.test(cert.protocol);
            checks.push({ name: 'TLS version', status: old ? 'fail' : 'pass', detail: `${cert.protocol}${old ? ' is outdated and insecure' : ''}` });
          }
        }
      } else {
        checks.push({ name: 'SSL certificate', status: 'fail', detail: 'No encryption. The site is served over plain HTTP' });
        findings.push('Website does not use HTTPS encryption');
        recommendations.push('Avoid entering any information on websites without HTTPS');
      }

      if (probe.chain.length > 1) {
        checks.push({ name: 'Redirects', status: probe.downgradedToHttp ? 'warn' : 'info', detail: `${probe.chain.length - 1} redirect(s). Final address: ${probe.finalUrl}` });
        if (probe.downgradedToHttp) findings.push('Redirects from HTTPS down to unencrypted HTTP');
      }

      // Security headers
      if (probe.finalHeaders) {
        const h = analyzeHeaders(probe.finalHeaders);
        score = h.score;
        grade = h.grade;
        headersStatus = `Grade ${h.grade} (${h.score}/100)`;
        for (const c of h.checks) {
          checks.push({ name: c.name, status: c.status, detail: c.detail });
          if (c.status === 'fail') findings.push(`${c.name}: ${c.detail}`);
        }
        if (h.grade === 'D' || h.grade === 'F') {
          recommendations.push('Site owners: add the missing security headers listed above (a few lines of server configuration)');
        }
      }
    }

    if (age) {
      const years = age.ageDays >= 365 ? `${(age.ageDays / 365).toFixed(1)} years` : `${age.ageDays} days`;
      checks.push({
        name: 'Domain age',
        status: age.ageDays < 30 ? 'fail' : age.ageDays < 180 ? 'warn' : 'pass',
        detail: `Registered ${years} ago (${age.createdAt})`,
      });
      if (age.ageDays < 30) findings.push('Very new domain, which is a common sign of scam sites');
    } else {
      checks.push({ name: 'Domain age', status: 'info', detail: 'Registration date not available for this domain' });
    }

    if (recommendations.length === 0) recommendations.push('No major problems found. Stay careful with any site that asks for passwords or payment');
    recommendations.push('This is a technical check of the site\'s configuration. It does not prove the site is trustworthy or safe');

    return res.status(200).json({
      status: 'success',
      httpsStatus,
      headersStatus,
      domainInfo: hostname,
      grade,
      score,
      checks,
      findings,
      recommendations,
      scanTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Website security info error:', error);
    return res.status(500).json({ status: 'error', message: 'Error checking website security' });
  }
};

// ============ F. PASSWORD BREACH RANGE (k-anonymity proxy) ============
// The browser sends only the first 5 characters of the SHA-1 hash. The password never leaves the device.

export const breachRange = async (req: Request, res: Response) => {
  const prefix = String(req.params.prefix || '').toUpperCase();
  if (!/^[0-9A-F]{5}$/.test(prefix)) {
    return res.status(400).json({ status: 'error', message: 'Invalid prefix' });
  }
  const text = await pwnedRange(prefix);
  if (text === null) {
    return res.status(502).json({ status: 'error', message: 'Breach database is not available right now' });
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send(text);
};
