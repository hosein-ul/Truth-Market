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
  crypto:   { label: "Crypto",   icon: Bitcoin,       text: "text-amber-400",   bg: "bg-amber-500/10 border border-amber-500/20",   dot: "bg-amber-500" },
  politics: { label: "Politics", icon: Landmark,      text: "text-blue-400",    bg: "bg-blue-500/10 border border-blue-500/20",     dot: "bg-blue-500" },
  sports:   { label: "Sports",   icon: Trophy,        text: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20", dot: "bg-emerald-500" },
  science:  { label: "Science",  icon: FlaskConical,  text: "text-cyan-400",    bg: "bg-cyan-500/10 border border-cyan-500/20",     dot: "bg-cyan-500" },
  finance:  { label: "Finance",  icon: TrendingUp,    text: "text-blue-400",    bg: "bg-blue-500/10 border border-blue-500/20",     dot: "bg-blue-500" },
};

const FALLBACK: CategoryMeta = {
  label: "Other",
  icon: Globe,
  text: "text-slate-400",
  bg: "bg-slate-500/10 border border-slate-500/20",
  dot: "bg-slate-500",
};

export function categoryMeta(category: string): CategoryMeta {
  const key = category?.toLowerCase().trim();
  return MAP[key] ?? { ...FALLBACK, label: category || "Other" };
}

export const CATEGORY_OPTIONS = ["Crypto", "Politics", "Sports", "Science", "Finance", "Other"];
