import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[72px] w-full resize-none rounded-xl border border-input/80 bg-background/30 px-3.5 py-2.5 text-base shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/80 hover:border-[color:var(--gold)]/35 focus-visible:border-[color:var(--gold)]/70 focus-visible:bg-background/50 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--gold)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
