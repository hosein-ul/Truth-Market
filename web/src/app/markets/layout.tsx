// Dashboard surface — distinct "zard-dark" (golden-yellow + black) theme,
// separate from the orange/sky landing page.
export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-dash">{children}</div>;
}
