import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryChip({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        meta.bg,
        meta.text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
