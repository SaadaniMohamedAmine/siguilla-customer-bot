import { lookup as dnsLookupCb } from "node:dns";
import { lookup as dnsLookup } from "node:dns/promises";
import net from "node:net";

/** Anti-SSRF : le crawler ne doit jamais atteindre localhost, le réseau privé ou les métadonnées cloud. */
export class UnsafeUrlError extends Error {
  constructor() {
    super("invalid_url");
  }
}

function isPrivateV4(ip: string): boolean {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 || // multicast + réservé
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local + métadonnées cloud
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function isPrivateV6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  const mappedHex = v.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return isPrivateV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (v.startsWith("64:ff9b:")) return true; // NAT64 : embarque une IPv4 arbitraire
  const first = parseInt(v.split(":")[0] || "0", 16);
  return (
    first === 0x2002 || // 6to4 : embarque une IPv4 arbitraire
    (first & 0xfe00) === 0xfc00 || // fc00::/7 (unique local)
    (first & 0xffc0) === 0xfe80 || // fe80::/10 (link-local)
    (first & 0xff00) === 0xff00 // multicast
  );
}

export function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateV4(ip);
  if (version === 6) return isPrivateV6(ip);
  return true; // illisible : on refuse
}

const BLOCKED_HOST = /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i;

/** Valide une URL fournie par un utilisateur : protocole, port, hôte et IP résolues publics. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new UnsafeUrlError();
  }
  if (!["http:", "https:"].includes(u.protocol)) throw new UnsafeUrlError();
  if (u.username || u.password) throw new UnsafeUrlError();
  if (u.port && u.port !== "80" && u.port !== "443") throw new UnsafeUrlError();

  const host = u.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (BLOCKED_HOST.test(host)) throw new UnsafeUrlError();
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new UnsafeUrlError();
    return u;
  }
  const addrs = await dnsLookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) throw new UnsafeUrlError();
  return u;
}

/**
 * `lookup` pour la connexion TCP (undici) : revalide l'IP au moment de se connecter,
 * ce qui ferme le DNS rebinding (domaine public à la vérification, IP privée à la connexion).
 */
export const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dnsLookupCb(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as { address: string; family: number }[];
    if (list.length === 0 || list.some((a) => isPrivateIp(a.address))) return callback(new UnsafeUrlError(), "", 0);
    if (options.all) return (callback as unknown as (e: null, a: typeof list) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};
