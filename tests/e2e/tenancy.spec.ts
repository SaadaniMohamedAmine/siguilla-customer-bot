import { test, expect, type APIRequestContext } from "@playwright/test";
import { MISSING_PASSWORD_REASON, testUsersPassword } from "./helpers";

// test1 et test2 ont chacun leur propre organisation personnelle (créées par le seed).
// On vérifie qu'un agent de test1 est invisible et inaccessible en écriture pour test2.
// Les deux comptes partagent le mot de passe TEST_USERS_PASSWORD (voir .env.example).
const AGENT_ID = "cmv78snow0000gow3jzmor4ay"; // "RAG Test", appartient à test1@sigilla.app
const password = testUsersPassword();

test.skip(!password, MISSING_PASSWORD_REASON);

async function signIn(request: APIRequestContext, email: string, password: string) {
  const res = await request.post("/api/auth/sign-in/email", { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  return res;
}

test.describe("tenancy isolation", () => {
  test("user B cannot read or write user A's chatbot", async ({ playwright }) => {
    const asB = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL as string });
    await signIn(asB, "test2@sigilla.app", password!);

    const get = await asB.get(`/api/chatbots/${AGENT_ID}`);
    expect([403, 404]).toContain(get.status());

    const sources = await asB.get(`/api/chatbots/${AGENT_ID}/sources`);
    expect([403, 404]).toContain(sources.status());

    const patch = await asB.patch(`/api/chatbots/${AGENT_ID}`, { data: { name: "hijacked" } });
    expect([403, 404]).toContain(patch.status());

    const playground = await asB.post(`/api/chatbots/${AGENT_ID}/playground`, { data: { question: "hi" } });
    expect([403, 404]).toContain(playground.status());

    await asB.dispose();
  });

  test("the owner can still read their own chatbot", async ({ playwright }) => {
    const asA = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL as string });
    await signIn(asA, "test1@sigilla.app", password!);
    const get = await asA.get(`/api/chatbots/${AGENT_ID}`);
    expect(get.ok()).toBeTruthy();
    await asA.dispose();
  });
});
