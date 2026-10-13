import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="font-serif text-h1 text-text">This page has left the house.</h1>
      <Button asChild variant="ghost">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
