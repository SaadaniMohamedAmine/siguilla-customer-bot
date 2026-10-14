import { requireOrgPage } from "@/lib/session";
import { ConversationsInbox } from "@/components/conversations/conversations-inbox";

export default async function ConversationDetailPage({ params }: PageProps<"/conversations/[id]">) {
  const { id } = await params;
  const { user } = await requireOrgPage();
  return <ConversationsInbox selectedId={id} currentUserName={user.name.split(" ")[0]} />;
}
