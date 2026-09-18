import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">
        <span className="mr-3 text-accent">404</span>Not found
      </p>
      <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-none md:text-[4rem]">
        That page went off the grid.
      </h1>
      <p className="mt-5 max-w-md text-muted">
        The link may be old, or the project may have moved. Everything I have built is listed on the work page.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/projects">Browse projects</Button>
        <Link href="/" className="link-underline self-center text-sm">
          Back home
        </Link>
      </div>
    </div>
  );
}
