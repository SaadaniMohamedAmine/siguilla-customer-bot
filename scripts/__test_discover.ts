import { discoverUrls } from "../lib/ingestion/crawler";

async function main() {
  console.log("starting discover");
  try {
    const urls = await discoverUrls("https://en.wikipedia.org/wiki/Capybara", 25);
    console.log("discovered:", JSON.stringify(urls));
  } catch (e) {
    console.log("DISCOVER FAIL:", e instanceof Error ? e.message : e);
  }
}
main();
