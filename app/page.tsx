import { redirect } from "next/navigation";

// Redirection temporaire vers /sign-in — la landing arrive en Phase 7.
export default function RootPage() {
  redirect("/sign-in");
}
