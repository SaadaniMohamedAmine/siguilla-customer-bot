import { test, expect, type APIRequestContext } from "@playwright/test";

// test1 et test2 ont chacun leur propre organisation personnelle (voir TEST_USERS.md).
// On vérifie qu'un agent de test1 est invisible et inaccessible en écriture pour test2.
const AGENT_ID = "cmv78snow0000gow3jzmor4ay"; // "RAG Test", appartient à test1@sigilla.app

async function signIn(request: APIRequestContext, email: string, password: string) {
  const res = await request.post("/api/auth/sign-in/email", { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  return res;
}

test.describe("tenancy isolation", () => {
  test("user B cannot read or write user A's chatbot", async ({ playwright }) => {
    const asB = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL as string });
    await signIn(asB, "test2@sigilla.app", "Test2Sigilla!");

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
    await signIn(asA, "test1@sigilla.app", "Test1Sigilla!");
    const get = await asA.get(`/api/chatbots/${AGENT_ID}`);
    expect(get.ok()).toBeTruthy();
    await asA.dispose();
  });
});
