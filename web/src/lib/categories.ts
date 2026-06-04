import {
  Bitcoin,
  Landmark,
  Trophy,
  FlaskConical,
  Globe,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  text: string;
  bg: string;
  dot: string;
}

const MAP: Record<string, CategoryMeta> = {
  crypto:   { label: "Crypto",   icon: Bitcoin,      text: "text-orange-700", bg: "bg-orange-50",  dot: "bg-orange-500" },
  politics: { label: "Politics", icon: Landmark,     text: "text-sky-700",    bg: "bg-sky-50",     dot: "bg-sky-500" },
  sports:   { label: "Sports",   icon: Trophy,       text: "text-emerald-700",bg: "bg-emerald-50", dot: "bg-emerald-500" },
  science:  { label: "Science",  icon: FlaskConical, text: "text-violet-700", bg: "bg-violet-50",  dot: "bg-violet-500" },
  finance:  { label: "Finance",  icon: TrendingUp,   text: "text-blue-700",   bg: "bg-blue-50",    dot: "bg-blue-500" },
};

const FALLBACK: CategoryMeta = {
  label: "Other",
  icon: Globe,
  text: "text-slate-700",
  bg: "bg-slate-100",
  dot: "bg-slate-500",
};

export function categoryMeta(category: string): CategoryMeta {
  const key = category?.toLowerCase().trim();
  return MAP[key] ?? { ...FALLBACK, label: category || "Other" };
}

export const CATEGORY_OPTIONS = ["Crypto", "Politics", "Sports", "Science", "Finance", "Other"];
