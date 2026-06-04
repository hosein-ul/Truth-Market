/* ─────────────────────────────────────────────
   DESIGN V2 — "Acid Electric"
   Palette: Hot Pink + Electric Lime + Deep Indigo
   Vibe: Gen-Z fintech, high-contrast, bold magazine
───────────────────────────────────────────── */

export default function V2() {
  const card = {
    background: "#fff",
    borderRadius: 20,
    border: "1.5px solid #e8e8f0",
    padding: "20px 22px",
    boxShadow: "0 2px 16px rgba(79,70,229,0.07)",
    cursor: "pointer",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f8f7ff", color: "#1a1a2e", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{ background: "#fff", borderBottom: "1.5px solid #ede9ff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #ec4899, #a855f7)", display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 15 }}>🔐</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em" }}>
              Truth<span style={{ background: "linear-gradient(120deg,#ec4899,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Market</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {["Markets", "Portfolio", "Create"].map(l => (
              <a key={l} href="#" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#6b7280", textDecoration: "none" }}>{l}</a>
            ))}
            <button style={{ padding: "8px 16px", borderRadius: 99, background: "linear-gradient(135deg, #ec4899, #a855f7)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO — Full gradient section ── */}
      <section style={{ background: "linear-gradient(150deg, #4f46e5 0%, #7c3aed 40%, #ec4899 100%)", padding: "70px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        {/* bright lime orb */}
        <div style={{ position: "absolute", top: -80, right: 80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(163,230,53,0.25) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 99, padding: "6px 14px", marginBottom: 24, fontSize: 12, fontWeight: 700, color: "#fff" }}>
              ✦ Zama FHEVM · Fully Homomorphic Encryption
            </div>
            <h1 style={{ fontSize: "clamp(38px, 5vw, 60px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 20px" }}>
              The prediction<br />
              market where<br />
              <span style={{ background: "linear-gradient(120deg, #a3e635, #84cc16)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                nothing leaks.
              </span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", maxWidth: 440, margin: "0 0 32px" }}>
              Bet amount + side encrypted on-chain via FHE. Zero information leakage while the market runs.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "14px 26px", borderRadius: 12, background: "#a3e635", color: "#1a1a2e", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(163,230,53,0.4)" }}>
                Explore Markets ↗
              </button>
              <button style={{ padding: "14px 26px", borderRadius: 12, background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                Create a market
              </button>
            </div>
          </div>

          {/* Right — stacked cards visual */}
          <div style={{ position: "relative" }}>
            {/* back card */}
            <div style={{ position: "absolute", top: 12, left: 12, right: -12, bottom: -12, background: "rgba(255,255,255,0.15)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)" }} />
            {/* main card */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "26px", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 11, background: "#f3f0ff", color: "#7c3aed", fontWeight: 700, borderRadius: 6, padding: "3px 9px", border: "1px solid #ddd6fe" }}>CRYPTO · LIVE</span>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#94a3b8" }}>⏰ 12 days left</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.4, color: "#1a1a2e", marginBottom: 18 }}>
                Will ETH hit $5,000 before July 2026?
              </div>
              {/* sealed treatment */}
              <div style={{ background: "linear-gradient(135deg, #f3f0ff 0%, #fdf4ff 100%)", borderRadius: 12, border: "1px solid #e9d5ff", padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #ec4899, #a855f7)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  🔐
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#6d28d9", fontSize: 13 }}>Position sealed</div>
                  <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>Odds hidden until the market settles</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={{ padding: "11px", borderRadius: 10, background: "#f0fdf4", border: "2px solid #86efac", color: "#15803d", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>YES ↑</button>
                <button style={{ padding: "11px", borderRadius: 10, background: "#fff1f2", border: "2px solid #fda4af", color: "#be123c", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>NO ↓</button>
              </div>
              {/* encrypted badge */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a3e635", display: "block", flexShrink: 0, boxShadow: "0 0 6px rgba(163,230,53,0.7)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>FHE encryption active — your input is sealed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ maxWidth: 1200, margin: "48px auto 0", display: "flex", gap: 0, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, overflow: "hidden" }}>
          {[
            { n: "12", l: "Open markets" },
            { n: "247", l: "Encrypted bets" },
            { n: "$48K", l: "Total volume" },
            { n: "0", l: "Leaks. Ever." },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: 1, padding: "18px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: i === 3 ? "#a3e635" : "#fff" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARKETS GRID ── */}
      <section style={{ padding: "52px 24px 64px", background: "#f8f7ff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: 24, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Active Markets</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>All positions sealed with FHE until settlement</p>
            </div>
            <button style={{ padding: "9px 18px", borderRadius: 99, background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + Create Market
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { q: "Will ETH hit $5,000 before July 2026?", cat: "Crypto", days: "12d", traders: 47 },
              { q: "Will the Fed cut rates in Q3 2026?", cat: "Finance", days: "23d", traders: 81 },
              { q: "Bitcoin ETF AUM exceeds $100B?", cat: "Crypto", days: "6d", traders: 112 },
            ].map((m, i) => (
              <div key={m.q} style={{ ...card }}>
                {/* colored top stripe */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: ["linear-gradient(90deg,#ec4899,#a855f7)", "linear-gradient(90deg,#4f46e5,#06b6d4)", "linear-gradient(90deg,#a3e635,#10b981)"][i] }} />
                <div style={{ paddingTop: 8, display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#f3f0ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 6, padding: "3px 8px" }}>{m.cat}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{m.days} left</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.4, color: "#1a1a2e", marginBottom: 16 }}>{m.q}</div>
                <div style={{ background: "#f8f7ff", borderRadius: 10, border: "1px solid #ede9ff", padding: "10px 12px", display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  <span>🔐</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>Position sealed</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f5f3ff", paddingTop: 12, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                  <span>👥 {m.traders} traders</span>
                  <span style={{ color: "#a855f7" }}>View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STRIP ── */}
      <section style={{ background: "#1a1a2e", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            Powered by <span style={{ background: "linear-gradient(120deg,#ec4899,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Zama FHEVM</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["@fhevm/solidity", "euint64 / ebool", "FHE.select()", "ERC-7984 cUSDC", "Sepolia"].map(t => (
              <span key={t} style={{ padding: "5px 12px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div style={{ position: "fixed", bottom: 20, right: 20, background: "linear-gradient(135deg,#ec4899,#a855f7)", color: "#fff", borderRadius: 99, padding: "8px 18px", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 20px rgba(236,72,153,0.4)" }}>
        Design V2 — Acid Electric
      </div>
    </div>
  );
}
