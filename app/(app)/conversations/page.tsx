import { EmptyState } from "@/components/ui/empty-state";
import { ConversationIcon } from "@/lib/icons";

export default function ConversationsPage() {
  return (
    <div>
      <h1 className="font-serif text-h1 text-text">Conversations</h1>
      <EmptyState
        icon={ConversationIcon}
        title="No conversations yet."
        description="Conversations will appear here once your agent starts answering visitors."
        className="mt-10"
      />
    </div>
  );
}
