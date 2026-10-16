import { Skeleton } from "@/components/ui/skeleton";

/** Affiché sous l'en-tête de l'agent pendant le chargement d'un onglet. */
export default function AgentLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="anim-keep h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="anim-keep h-64 w-full rounded-lg" />
    </div>
  );
}
