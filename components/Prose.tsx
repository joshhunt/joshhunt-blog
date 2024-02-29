import { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <article className="prose prose-josh-zinc dark:prose-invert">
      {children}
    </article>
  );
}
