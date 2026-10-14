import { requireOrgPage } from "@/lib/session";
import { ConversationsInbox } from "@/components/conversations/conversations-inbox";

export default async function ConversationsPage() {
  const { user } = await requireOrgPage();
  return <ConversationsInbox currentUserName={user.name.split(" ")[0]} />;
}
