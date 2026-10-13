import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsIcon } from "@/lib/icons";

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="font-serif text-h1 text-text">Analytics</h1>
      <EmptyState
        icon={AnalyticsIcon}
        title="Analytics appear after your first conversations."
        className="mt-10"
      />
    </div>
  );
}
