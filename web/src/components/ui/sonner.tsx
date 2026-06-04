"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-xl border border-border bg-card text-card-foreground shadow-lift",
          title: "font-semibold text-sm",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-primary text-primary-foreground rounded-lg text-xs",
          cancelButton: "bg-secondary text-secondary-foreground rounded-lg text-xs",
          error: "border-no-ring/50",
          success: "border-yes-ring/50",
        },
      }}
      {...props}
    />
  );
}
