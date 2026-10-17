import { Skeleton } from "@/components/ui/skeleton";

/** Squelette affiché pendant le chargement serveur d'une page du dashboard (le shell reste en place). */
export default function AppLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="anim-keep h-10 w-56" />
        <Skeleton className="anim-keep h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="anim-keep h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="anim-keep h-72 w-full rounded-lg" />
    </div>
  );
}
