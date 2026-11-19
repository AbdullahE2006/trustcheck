import dns from 'dns';
import net from 'net';
import http from 'http';
import https from 'https';

// ---------- SSRF protection ----------

export const isPrivateIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local, cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1') return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (/^fe[89ab]/.test(v)) return true; // link-local
    if (/^f[cd]/.test(v)) return true; // unique local
    if (v.startsWith('ff')) return true; // multicast
    if (v.startsWith('2001:db8')) return true; // documentation
    if (v.startsWith('64:ff9b')) return true; // NAT64
    return false;
  }
  return true; // not a valid IP: treat as unsafe
};

// DNS lookup that refuses private/internal addresses (also protects against DNS rebinding,
// because the check happens at connection time).
const safeLookup = (hostname: string, options: any, callback: any) => {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) {
      return callback(new Error('BLOCKED_PRIVATE_ADDRESS'));
    }
    if (options && options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

// ---------- Single request ----------

export interface CertInfo {
  authorized: boolean;
  authError: string | null;
  subject: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysLeft: number | null;
  protocol: string | null;
}

export interface HopResult {
  url: string;
  status: number;
  headers: http.IncomingHttpHeaders;
  cert: CertInfo | null;
}

const requestOnce = (u: URL, method: 'HEAD' | 'GET', timeoutMs: number): Promise<HopResult> =>
  new Promise((resolve, reject) => {
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: u.hostname,
        port: isHttps ? 443 : 80, // only standard ports are ever contacted
        path: u.pathname + u.search,
        method,
        lookup: safeLookup as any,
        rejectUnauthorized: false, // we want to inspect bad certificates, not fail on them
        timeout: timeoutMs,
        headers: { 'User-Agent': 'TrustCheck-Scanner/1.0', Accept: '*/*' },
      },
      (res) => {
        let cert: CertInfo | null = null;
        if (isHttps) {
          const socket: any = res.socket;
          const c = socket.getPeerCertificate ? socket.getPeerCertificate() : null;
          const validTo = c && c.valid_to ? new Date(c.valid_to) : null;
          cert = {
            authorized: !!socket.authorized,
            authError: socket.authorizationError ? String(socket.authorizationError) : null,
            subject: c?.subject?.CN || null,
            issuer: c?.issuer?.O || c?.issuer?.CN || null,
            validFrom: c?.valid_from || null,
            validTo: c?.valid_to || null,
            daysLeft: validTo ? Math.floor((validTo.getTime() - Date.now()) / 86400000) : null,
            protocol: socket.getProtocol ? socket.getProtocol() : null,
          };
        }
        const result: HopResult = {
          url: u.toString(),
          status: res.statusCode || 0,
          headers: res.headers,
          cert,
        };
        res.destroy(); // never download the body
        resolve(result);
      }
    );
    req.on('timeout', () => req.destroy(new Error('TIMEOUT')));
    req.on('error', reject);
    req.end();
  });

// ---------- Follow redirects safely ----------

export interface ProbeResult {
  ok: boolean;
  error?: string;
  chain: { url: string; status: number }[];
  finalUrl?: string;
  finalStatus?: number;
  finalHeaders?: http.IncomingHttpHeaders;
  firstCert?: CertInfo | null;
  finalCert?: CertInfo | null;
  downgradedToHttp?: boolean;
}

const describeError = (e: any): string => {
  const m = String(e?.message || e);
  if (m === 'BLOCKED_PRIVATE_ADDRESS') return 'BLOCKED';
  if (m === 'TIMEOUT') return 'TIMEOUT';
  if (e?.code === 'ENOTFOUND' || e?.code === 'EAI_AGAIN') return 'DNS_NOT_FOUND';
  if (e?.code === 'ECONNREFUSED') return 'REFUSED';
  if (e?.code === 'ECONNRESET') return 'RESET';
  return 'FAILED';
};

export const probeUrl = async (startUrl: string, maxRedirects = 4, perRequestMs = 3000): Promise<ProbeResult> => {
  const chain: { url: string; status: number }[] = [];
  let current: URL;
  try {
    current = new URL(startUrl);
  } catch {
    return { ok: false, error: 'INVALID_URL', chain };
  }

  let firstCert: CertInfo | null | undefined;
  let finalCert: CertInfo | null | undefined;
  let finalHeaders: http.IncomingHttpHeaders | undefined;
  let finalStatus: number | undefined;
  let downgradedToHttp = false;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') {
      return { ok: false, error: 'BAD_PROTOCOL', chain };
    }
    const host = current.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && isPrivateIp(host)) {
      return { ok: false, error: 'BLOCKED', chain };
    }

    let result: HopResult;
    try {
      result = await requestOnce(current, 'HEAD', perRequestMs);
      if ([400, 403, 405, 501].includes(result.status)) {
        result = await requestOnce(current, 'GET', perRequestMs);
      }
    } catch (e1) {
      try {
        result = await requestOnce(current, 'GET', perRequestMs);
      } catch (e2) {
        return { ok: false, error: describeError(e2), chain, firstCert, finalCert };
      }
    }

    chain.push({ url: result.url, status: result.status });
    if (firstCert === undefined && result.cert) firstCert = result.cert;
    finalCert = result.cert;
    finalHeaders = result.headers;
    finalStatus = result.status;

    const location = result.headers.location;
    if (result.status >= 300 && result.status < 400 && location) {
      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        break;
      }
      if (current.protocol === 'https:' && next.protocol === 'http:') downgradedToHttp = true;
      current = next;
      continue;
    }
    break;
  }

  return {
    ok: true,
    chain,
    finalUrl: current.toString(),
    finalStatus,
    finalHeaders,
    firstCert,
    finalCert,
    downgradedToHttp,
  };
};

// ---------- Security headers ----------

export interface HeaderCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  points: number;
  max: number;
}

export const analyzeHeaders = (h: http.IncomingHttpHeaders) => {
  const checks: HeaderCheck[] = [];
  const get = (k: string) => {
    const v = h[k];
    return Array.isArray(v) ? v.join(', ') : v || '';
  };

  const hsts = get('strict-transport-security');
  const hstsAge = Number((hsts.match(/max-age=(\d+)/i) || [])[1] || 0);
  checks.push(
    hsts
      ? hstsAge >= 15552000
        ? { name: 'HSTS', status: 'pass', detail: 'Forces browsers to always use HTTPS', points: 20, max: 20 }
        : { name: 'HSTS', status: 'warn', detail: 'Present but the duration is short (use at least 6 months)', points: 10, max: 20 }
      : { name: 'HSTS', status: 'fail', detail: 'Missing. Browsers are not forced to use HTTPS', points: 0, max: 20 }
  );

  const csp = get('content-security-policy');
  checks.push(
    csp
      ? /unsafe-eval|script-src[^;]*'unsafe-inline'/i.test(csp)
        ? { name: 'Content-Security-Policy', status: 'warn', detail: 'Present but allows unsafe inline/eval scripts', points: 15, max: 25 }
        : { name: 'Content-Security-Policy', status: 'pass', detail: 'Restricts where scripts and content can load from', points: 25, max: 25 }
      : { name: 'Content-Security-Policy', status: 'fail', detail: 'Missing. Weaker protection against cross-site scripting (XSS)', points: 0, max: 25 }
  );

  const xfo = get('x-frame-options');
  const frameAncestors = /frame-ancestors/i.test(csp);
  checks.push(
    xfo || frameAncestors
      ? { name: 'Clickjacking protection', status: 'pass', detail: 'The page cannot be embedded in other sites', points: 15, max: 15 }
      : { name: 'Clickjacking protection', status: 'fail', detail: 'Missing X-Frame-Options / frame-ancestors', points: 0, max: 15 }
  );

  checks.push(
    get('x-content-type-options').toLowerCase().includes('nosniff')
      ? { name: 'X-Content-Type-Options', status: 'pass', detail: 'Stops browsers from guessing file types', points: 15, max: 15 }
      : { name: 'X-Content-Type-Options', status: 'fail', detail: 'Missing "nosniff"', points: 0, max: 15 }
  );

  checks.push(
    get('referrer-policy')
      ? { name: 'Referrer-Policy', status: 'pass', detail: 'Controls how much of the URL is shared with other sites', points: 10, max: 10 }
      : { name: 'Referrer-Policy', status: 'warn', detail: 'Missing. Full URLs may be shared with other sites', points: 0, max: 10 }
  );

  checks.push(
    get('permissions-policy')
      ? { name: 'Permissions-Policy', status: 'pass', detail: 'Limits access to camera, microphone, location and more', points: 10, max: 10 }
      : { name: 'Permissions-Policy', status: 'warn', detail: 'Missing. Browser features are not restricted', points: 0, max: 10 }
  );

  const leak = `${get('server')} ${get('x-powered-by')}`;
  checks.push(
    /\d+\.\d+/.test(leak)
      ? { name: 'Version disclosure', status: 'warn', detail: 'Server reveals software versions, which helps attackers', points: 0, max: 5 }
      : { name: 'Version disclosure', status: 'pass', detail: 'No software versions exposed', points: 5, max: 5 }
  );

  const total = checks.reduce((s, c) => s + c.points, 0);
  const max = checks.reduce((s, c) => s + c.max, 0);
  const score = Math.round((total / max) * 100);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 35 ? 'D' : 'F';
  return { checks, score, grade };
};

// ---------- Domain age (RDAP) ----------

export const domainAge = async (domain: string): Promise<{ createdAt: string; ageDays: number } | null> => {
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain) || domain.length > 253) return null;
  try {
    const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const ev = (data.events || []).find((e: any) => e.eventAction === 'registration');
    if (!ev?.eventDate) return null;
    const created = new Date(ev.eventDate);
    if (isNaN(created.getTime())) return null;
    return {
      createdAt: created.toISOString().slice(0, 10),
      ageDays: Math.floor((Date.now() - created.getTime()) / 86400000),
    };
  } catch {
    return null;
  }
};

// ---------- Email sender authentication (SPF / DMARC) ----------

export const emailAuthRecords = async (domain: string) => {
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) return null;

  // Returns [] when the record definitely does not exist, null when the lookup itself failed
  const txt = async (name: string): Promise<string[] | null> => {
    try {
      const recs = await dns.promises.resolveTxt(name);
      return recs.map((r) => r.join(''));
    } catch (e: any) {
      if (e?.code === 'ENODATA' || e?.code === 'ENOTFOUND') return [];
      return null;
    }
  };

  const [root, dmarc] = await Promise.all([txt(domain), txt(`_dmarc.${domain}`)]);
  if (root === null || dmarc === null) return null; // unknown: do not accuse the sender

  const spf = root.find((r) => r.toLowerCase().startsWith('v=spf1')) || null;
  const dmarcRec = dmarc.find((r) => r.toLowerCase().startsWith('v=dmarc1')) || null;
  let dmarcPolicy: string | null = null;
  if (dmarcRec) {
    const p = dmarcRec.match(/(?:^|;)\s*p=(\w+)/i);
    dmarcPolicy = p ? p[1].toLowerCase() : null;
  }
  return { spf, dmarc: dmarcRec, dmarcPolicy };
};

// ---------- Password breach range (HaveIBeenPwned k-anonymity) ----------

export const pwnedRange = async (prefix: string): Promise<string | null> => {
  if (!/^[0-9A-F]{5}$/.test(prefix)) return null;
  try {
    const r = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'TrustCheck' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
};

export const withDeadline = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
