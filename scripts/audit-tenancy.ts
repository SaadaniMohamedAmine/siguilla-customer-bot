// npx tsx scripts/audit-tenancy.ts [--base=https://...] [--destructive]
//
// W1 — balayage d'isolation entre organisations. Se connecte avec deux comptes de test (A = test1, B = test2,
// chacun dans sa propre organisation) puis tente, avec la session de B, d'atteindre les ressources de A.
// Attendu partout : 401 sans session, 403/404 avec la session de B.
//
// Par défaut : lectures + écritures SANS EFFET (corps invalide, ou valeur identique à l'existante).
// --destructive : ajoute les écritures sans corps (resolve, takeover, resync, DELETE d'une source puis de l'agent) ;
//                 si une route est vulnérable, elles modifient VRAIMENT les données de A. Uniquement après une
//                 passe par défaut entièrement PASS, et uniquement sur des données de test.
// Jamais appelées : DELETE /api/organization, /api/billing/*, /api/notion/connect.
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith("--base="))?.split("=")[1] ?? "https://siguilla-customer-bot.vercel.app").replace(/\/$/, "");
const DESTRUCTIVE = args.includes("--destructive");
const EMAIL_A = process.env.TENANCY_USER_A ?? "test1@sigilla.app";
const EMAIL_B = process.env.TENANCY_USER_B ?? "test2@sigilla.app";

function testPassword(): string | undefined {
  if (process.env.TEST_USERS_PASSWORD) return process.env.TEST_USERS_PASSWORD;
  if (!existsSync(".env.local")) return undefined;
  return parse(readFileSync(".env.local")).TEST_USERS_PASSWORD || undefined;
}

// Les réponses sont explorées à l'aveugle (formes variées, parfois en erreur) : `any` est voulu dans cette sonde.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reply = { status: number; json: any; text: string };

class Client {
  private jar = new Map<string, string>();
  constructor(readonly label: string) {}

  async req(method: string, path: string, body?: unknown): Promise<Reply> {
    const headers: Record<string, string> = { origin: BASE, "content-type": "application/json" };
    if (this.jar.size) headers.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim();
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c)) this.jar.delete(name);
      else this.jar.set(name, pair.slice(i + 1));
    }
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text };
  }

  async signIn(email: string, password: string) {
    const r = await this.req("POST", "/api/auth/sign-in/email", { email, password });
    if (r.status !== 200) throw new Error(`Connexion de ${email} impossible (HTTP ${r.status}) : mot de passe partagé incorrect ?`);
  }
}

const rows: { id: string; check: string; expected: string; got: string; pass: boolean }[] = [];
const record = (id: string, check: string, expected: string, got: string | number, pass: boolean) =>
  rows.push({ id, check, expected, got: String(got), pass });
const denied = (s: number) => s === 403 || s === 404;

/** Sonde avec la session de B : attendu 403 ou 404. */
async function asB(b: Client, id: string, method: string, path: string, body?: unknown) {
  const r = await b.req(method, path, body);
  record(id, `B  ${method} ${path}`, "403/404", r.status, denied(r.status));
  return r;
}
/** Sonde sans session : attendu 401. */
async function anon(a0: Client, id: string, method: string, path: string, body?: unknown) {
  const r = await a0.req(method, path, body);
  record(id, `∅  ${method} ${path}`, "401", r.status, r.status === 401);
}

function table() {
  const w = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));
  console.log("\n" + w("", 3) + w("ID", 6) + w("Sonde", 74) + w("Attendu", 9) + "Reçu");
  for (const r of rows) console.log(w(r.pass ? "OK" : "KO", 3) + w(r.id, 6) + w(r.check, 74) + w(r.expected, 9) + r.got);
  const ko = rows.filter((r) => !r.pass).length;
  console.log(`\n${rows.length - ko}/${rows.length} sondes conformes` + (ko ? ` — ${ko} ÉCHEC(S)` : " — aucune fuite détectée"));
  return ko;
}

async function main() {
  const password = testPassword();
  if (!password) throw new Error("TEST_USERS_PASSWORD manquant (environnement ou .env.local).");
  console.log(`Cible : ${BASE}\nComptes : A=${EMAIL_A}  B=${EMAIL_B}\nMode : ${DESTRUCTIVE ? "DESTRUCTIF (+ écritures sans corps)" : "sans danger"}`);

  const A = new Client("A");
  const B = new Client("B");
  const NOBODY = new Client("anonyme");
  await A.signIn(EMAIL_A, password);
  await B.signIn(EMAIL_B, password);

  // --- Découverte des ressources de A ---
  const sessionA = await A.req("GET", "/api/auth/get-session");
  const orgA: string | undefined = sessionA.json?.session?.activeOrganizationId ?? (await A.req("GET", "/api/auth/organization/list")).json?.[0]?.id;
  const chatbotsA = (await A.req("GET", "/api/chatbots")).json?.data ?? [];
  const agentA = chatbotsA[0];
  if (!agentA) throw new Error("Le compte A n'a aucun agent : rien à attaquer.");
  const agentId: string = agentA.id;
  const agentName: string = agentA.name;
  const sourceId: string | undefined = (await A.req("GET", `/api/chatbots/${agentId}/sources`)).json?.data?.[0]?.id;
  const convId: string | undefined = (await A.req("GET", "/api/conversations")).json?.data?.[0]?.id;
  console.log(`Ressources de A : agent ${agentId}, source ${sourceId ?? "(aucune)"}, conversation ${convId ?? "(aucune)"}, organisation ${orgA ?? "(inconnue)"}`);

  // --- Précondition : B ne doit PAS être membre de l'organisation de A (sinon les sondes Better Auth sont sans objet) ---
  if (orgA) {
    const members = (await A.req("GET", `/api/auth/organization/get-full-organization?organizationId=${orgA}`)).json?.members ?? [];
    if (members.some((m: { user?: { email?: string } }) => m.user?.email === EMAIL_B)) {
      throw new Error(
        `${EMAIL_B} est déjà membre de l'organisation de ${EMAIL_A} : l'audit serait faussé. ` +
          `Retire-le (connecté en ${EMAIL_A} : Settings → Organization → Members → corbeille) puis relance.`,
      );
    }
  }

  // --- Listes de B : aucune ressource de A ---
  const listB = await B.req("GET", "/api/chatbots");
  record("W1-L1", "B  GET /api/chatbots ne contient pas l'agent de A", "absent", listB.status, listB.status === 200 && !JSON.stringify(listB.json).includes(agentId));
  if (convId) {
    const convB = await B.req("GET", "/api/conversations");
    record("W1-L2", "B  GET /api/conversations ne contient pas la conversation de A", "absent", convB.status, convB.status === 200 && !JSON.stringify(convB.json).includes(convId));
  }
  const anaB = await B.req("GET", "/api/analytics");
  record("W1-L3", "B  GET /api/analytics ne mentionne pas l'agent de A", "absent", anaB.status, anaB.status === 200 && !anaB.text.includes(agentId));

  // --- Sans session : 401 partout ---
  await anon(NOBODY, "W1-N1", "GET", "/api/chatbots");
  await anon(NOBODY, "W1-N2", "GET", `/api/chatbots/${agentId}`);
  await anon(NOBODY, "W1-N3", "GET", `/api/chatbots/${agentId}/sources`);
  await anon(NOBODY, "W1-N4", "POST", `/api/chatbots/${agentId}/playground`, {});
  await anon(NOBODY, "W1-N5", "GET", "/api/conversations");
  await anon(NOBODY, "W1-N6", "GET", "/api/analytics");
  if (convId) await anon(NOBODY, "W1-N7", "GET", `/api/conversations/${convId}`);

  // --- Session de B sur les ressources de A (sans danger) ---
  await asB(B, "W1-R1", "GET", `/api/chatbots/${agentId}`);
  await asB(B, "W1-R2", "GET", `/api/chatbots/${agentId}/sources`);
  if (convId) await asB(B, "W1-R3", "GET", `/api/conversations/${convId}`);
  await asB(B, "W1-W1", "PATCH", `/api/chatbots/${agentId}`, { name: agentName }); // valeur identique : sans effet si la route fuit
  await asB(B, "W1-W2", "POST", `/api/chatbots/${agentId}/sources`, {}); // corps invalide : un 400 trahit l'absence de contrôle d'organisation
  await asB(B, "W1-W3", "POST", `/api/chatbots/${agentId}/playground`, {}); // = K13
  await asB(B, "W1-W4", "POST", `/api/chatbots/${agentId}/avatar`, {});
  await asB(B, "W1-W5", "POST", `/api/chatbots/${agentId}/sources/upload`, {});
  if (convId) await asB(B, "W1-W6", "POST", `/api/conversations/${convId}/reply`, {});

  // --- Better Auth : B demande l'organisation de A ---
  if (orgA) {
    const full = await B.req("GET", `/api/auth/organization/get-full-organization?organizationId=${orgA}`);
    record("W1-A1", "B  GET organization/get-full-organization (org de A)", "refus", full.status, full.status >= 400 || !full.json?.members?.length);
    const members = await B.req("GET", `/api/auth/organization/list-members?organizationId=${orgA}`);
    record("W1-A2", "B  GET organization/list-members (org de A)", "refus", members.status, members.status >= 400 || !members.json?.members?.length);
    const nameA = (await A.req("GET", `/api/auth/organization/get-full-organization?organizationId=${orgA}`)).json?.name;
    if (nameA) {
      const upd = await B.req("POST", "/api/auth/organization/update", { organizationId: orgA, data: { name: nameA } }); // nom identique : sans effet
      record("W1-A3", "B  POST organization/update (org de A, nom inchangé)", "403/404", upd.status, upd.status >= 400);
    }
  }

  // --- Widget public : une conversation de A n'est pas lisible hors de son agent ou de son visiteur ---
  if (convId && agentA.publicKey) {
    const wrongVisitor = await NOBODY.req("GET", `/api/public/v1/conversations/${convId}/messages?pk=${agentA.publicKey}&visitorId=intrus-${Date.now()}`);
    record("W1-P1", "∅  GET public/…/messages (bon agent, mauvais visiteur)", "403/404", wrongVisitor.status, denied(wrongVisitor.status));
    const botB = (await B.req("GET", "/api/chatbots")).json?.data?.[0];
    if (botB?.publicKey) {
      const otherBot = await NOBODY.req("GET", `/api/public/v1/conversations/${convId}/messages?pk=${botB.publicKey}&visitorId=intrus-${Date.now()}`);
      record("W1-P2", "∅  GET public/…/messages (autre agent)", "403/404", otherBot.status, denied(otherBot.status));
    }
  }

  // En dernier : si elle réussissait, elle changerait l'organisation active de B et fausserait les sondes suivantes.
  if (orgA) {
    const active = await B.req("POST", "/api/auth/organization/set-active", { organizationId: orgA });
    record("W1-A4", "B  POST organization/set-active (org de A)", "refus", active.status, active.status >= 400);
  }

  const failures = table();
  if (failures) {
    console.log("\nAu moins une fuite : correctif d'abord, les écritures destructives ne sont pas lancées.");
    process.exit(1);
  }

  // --- Écritures sans corps (uniquement avec --destructive, après une passe entièrement conforme) ---
  if (DESTRUCTIVE) {
    console.log("\n--- Passe destructive (données de test de A) ---");
    if (convId) {
      await asB(B, "W1-D1", "POST", `/api/conversations/${convId}/takeover`);
      await asB(B, "W1-D2", "POST", `/api/conversations/${convId}/resolve`);
    }
    if (sourceId) {
      await asB(B, "W1-D3", "POST", `/api/sources/${sourceId}/resync`);
      await asB(B, "W1-D4", "DELETE", `/api/sources/${sourceId}`);
    }
    await asB(B, "W1-D5", "DELETE", `/api/chatbots/${agentId}`);
    // L'agent de A doit toujours exister, inchangé.
    const still = await A.req("GET", `/api/chatbots/${agentId}`);
    record("W1-D6", "A  son agent existe toujours, nom inchangé", "200", still.status, still.status === 200 && still.json?.data?.name === agentName);
    if (sourceId) {
      const stillSources = await A.req("GET", `/api/chatbots/${agentId}/sources`);
      record("W1-D7", "A  sa source existe toujours", "présente", stillSources.status, stillSources.json?.data?.some((s: { id: string }) => s.id === sourceId) === true);
    }
    process.exit(table() ? 1 : 0);
  }
}

main().catch((e) => {
  console.error("\nErreur :", e instanceof Error ? e.message : e);
  process.exit(2);
});
