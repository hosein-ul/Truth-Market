/* ─────────────────────────────────────────────
   DESIGN V1 — "Solar Burst"
   Palette: Vivid Orange + Sky Blue + White
   Vibe: hot, energetic, Polymarket-meets-Figma
───────────────────────────────────────────── */

export default function V1() {
  return (
    <div style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", background: "#fff", color: "#0f172a", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: "1px solid #f1f5f9", background: "#fff", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #fb923c)", display: "grid", placeItems: "center", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
              <span style={{ fontSize: 16 }}>🔐</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
              Truth<span style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Market</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["Markets", "Portfolio", "Create"].map(l => (
              <a key={l} href="#" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>{l}</a>
            ))}
            <button style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}>
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 24px 72px", background: "linear-gradient(160deg, #fff7ed 0%, #fff 40%, #f0f9ff 100%)" }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 999, padding: "6px 14px", marginBottom: 24, fontSize: 12, fontWeight: 700, color: "#ea580c" }}>
              ⚡ Powered by Zama FHEVM · Sepolia
            </div>

            <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
              Bet smart.<br />
              <span style={{ background: "linear-gradient(120deg, #f97316 0%, #fbbf24 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Stay private.</span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.7, color: "#64748b", maxWidth: 480, margin: "0 0 32px" }}>
              Your bet amount and side are <strong style={{ color: "#0f172a" }}>encrypted on-chain</strong> using Fully Homomorphic Encryption. No signals, no whale-watching, no exposure.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "14px 28px", borderRadius: 12, background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 6px 20px rgba(249,115,22,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                Explore Markets →
              </button>
              <button style={{ padding: "14px 28px", borderRadius: 12, background: "#fff", color: "#0f172a", border: "1.5px solid #e2e8f0", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                Create Market
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32, marginTop: 40, paddingTop: 32, borderTop: "1px solid #f1f5f9" }}>
              {[
                { n: "12", l: "Live markets" },
                { n: "247", l: "Encrypted bets" },
                { n: "$48K", l: "Total volume" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{s.n}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — encrypted bet card mockup */}
          <div style={{ position: "relative" }}>
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>Crypto · Live · Sealed</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", borderRadius: 6, padding: "3px 8px" }}>🔒 Open</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.4, marginBottom: 16, color: "#0f172a" }}>
                Will ETH hit $5,000 before July 2026?
              </div>

              {/* Sealed odds */}
              <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", border: "1px solid #fde68a", borderRadius: 14, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #fbbf24)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  🔐
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#92400e", fontSize: 13 }}>Position sealed</div>
                  <div style={{ fontSize: 12, color: "#b45309", marginTop: 1 }}>Odds hidden until market settles</div>
                </div>
              </div>

              {/* Bet inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <button style={{ padding: "12px 8px", borderRadius: 10, background: "#f0fdf4", border: "2px solid #86efac", color: "#15803d", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                  YES ↑
                </button>
                <button style={{ padding: "12px 8px", borderRadius: 10, background: "#fff1f2", border: "2px solid #fda4af", color: "#be123c", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                  NO ↓
                </button>
              </div>
              <input
                placeholder="Enter USDC amount…"
                readOnly
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, background: "#f8fafc", boxSizing: "border-box", outline: "none", color: "#64748b" }}
              />
              <button style={{ width: "100%", marginTop: 10, padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
                Place Encrypted Bet
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "56px 24px", background: "#fff", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {[
            { icon: "🫣", title: "Sealed positions", body: "Amount and side encrypted before they hit the chain. No one reads your bet while the market is open.", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
            { icon: "🙅", title: "No herding", body: "Odds hidden until settlement. No whale signals, no crowd to follow. Trade on your own conviction.", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
            { icon: "🏆", title: "Private payouts", body: "Winnings settle via ERC-7984 confidential transfer. Only your wallet decrypts your balance.", color: "#10b981", bg: "#f0fdf4", border: "#86efac" },
          ].map(f => (
            <div key={f.title} style={{ padding: "24px", borderRadius: 16, background: f.bg, border: `1px solid ${f.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#64748b" }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARKET CARDS ── */}
      <section style={{ padding: "40px 24px 64px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 4px" }}>Live Markets</h2>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>All odds sealed until settlement</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { q: "Will ETH hit $5,000 before July 2026?", cat: "Crypto", days: "12d left", traders: 47 },
              { q: "Will the Fed cut rates in Q3 2026?", cat: "Finance", days: "23d left", traders: 81 },
              { q: "Will Bitcoin ETF AUM exceed $100B?", cat: "Crypto", days: "6d left", traders: 112 },
            ].map(m => (
              <div key={m.q} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", borderRadius: 6, padding: "3px 8px" }}>
                    {m.cat}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 6, padding: "3px 8px" }}>
                    🔒 Sealed
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 16, color: "#0f172a" }}>{m.q}</div>
                <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <span>🔐</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Position sealed</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 12, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                  <span>👥 {m.traders} traders</span>
                  <span style={{ color: "#f97316" }}>⏰ {m.days}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Label */}
      <div style={{ position: "fixed", bottom: 20, right: 20, background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", borderRadius: 99, padding: "8px 18px", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
        Design V1 — Solar Burst
      </div>
    </div>
  );
}
