/* ─────────────────────────────────────────────
   DESIGN V3 — "Aurora Glass"
   Palette: Teal + Coral + Vivid Amber on cream
   Vibe: Calm-premium, editorial, glassmorphic cards
───────────────────────────────────────────── */

export default function V3() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fafaf7", color: "#1c1917", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,250,247,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #0d9488, #06b6d4)", display: "grid", placeItems: "center", boxShadow: "0 4px 10px rgba(13,148,136,0.3)" }}>
              <span style={{ fontSize: 14 }}>🔐</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.02em" }}>
              Truth<span style={{ background: "linear-gradient(120deg,#0d9488,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Market</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["Markets", "Portfolio", "Create"].map(l => (
              <a key={l} href="#" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#78716c", textDecoration: "none" }}>{l}</a>
            ))}
            <button style={{ marginLeft: 8, padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO — big centered, clean ── */}
      <section style={{ position: "relative", padding: "90px 24px 80px", overflow: "hidden" }}>
        {/* aurora mesh */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(13,148,136,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 30%, rgba(251,146,60,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 50% 90%, rgba(234,179,8,0.07) 0%, transparent 60%)" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", marginBottom: 60 }}>
            {/* pill badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #d1fae5", borderRadius: 999, padding: "7px 16px", marginBottom: 28, fontSize: 12, fontWeight: 700, color: "#0d9488", boxShadow: "0 2px 8px rgba(13,148,136,0.12)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0d9488", display: "inline-block", boxShadow: "0 0 6px rgba(13,148,136,0.6)" }} />
              Live on Ethereum Sepolia — Zama FHEVM
            </div>

            <h1 style={{ fontSize: "clamp(42px, 5.5vw, 70px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em", margin: "0 0 22px", color: "#1c1917" }}>
              Prediction markets<br />
              <span style={{ background: "linear-gradient(120deg, #0d9488 0%, #06b6d4 40%, #f97316 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                where your bet stays secret.
              </span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.7, color: "#78716c", margin: "0 0 36px", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
              Amount and side encrypted on-chain with FHE. No whale signals.
              No herding. Odds only revealed at settlement.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button style={{ padding: "15px 30px", borderRadius: 14, background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "#fff", border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 24px rgba(13,148,136,0.3)", letterSpacing: "-0.01em" }}>
                Explore Markets →
              </button>
              <button style={{ padding: "15px 30px", borderRadius: 14, background: "#fff", color: "#1c1917", border: "1.5px solid #e7e5e4", fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                Create Market
              </button>
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
              {[
                { n: "12", l: "Markets", col: "#0d9488" },
                { n: "247", l: "Bets placed", col: "#f97316" },
                { n: "$48K", l: "Volume", col: "#eab308" },
              ].map(s => (
                <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 12, padding: "10px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: s.col }}>{s.n}</span>
                  <span style={{ fontSize: 12, color: "#a8a29e", fontWeight: 600 }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glassmorphic market cards — large and visual */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { q: "Will ETH hit $5,000 before July 2026?", cat: "Crypto", days: "12d", traders: 47, accent: "#0d9488", bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)" },
              { q: "Will the Fed cut rates in Q3 2026?", cat: "Finance", days: "23d", traders: 81, accent: "#f97316", bg: "linear-gradient(135deg, #fff7ed, #fed7aa)" },
              { q: "Bitcoin ETF AUM exceeds $100B?", cat: "Crypto", days: "6d", traders: 112, accent: "#eab308", bg: "linear-gradient(135deg, #fefce8, #fef08a)" },
            ].map(m => (
              <div key={m.q} style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", overflow: "hidden", cursor: "pointer" }}>
                {/* colored gradient top */}
                <div style={{ background: m.bg, padding: "20px 22px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.7)", color: m.accent, border: `1.5px solid ${m.accent}30`, borderRadius: 8, padding: "3px 9px" }}>{m.cat}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#78716c" }}>⏰ {m.days} left</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.4, color: "#1c1917" }}>{m.q}</div>
                </div>
                {/* card body */}
                <div style={{ padding: "16px 22px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f5f5f4", borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${m.accent}20`, display: "grid", placeItems: "center", flexShrink: 0, border: `1.5px solid ${m.accent}30` }}>
                      🔐
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1c1917" }}>Sealed — FHE encrypted</div>
                      <div style={{ fontSize: 11, color: "#a8a29e" }}>Odds reveal at settlement</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#f0fdf4", border: "1.5px solid #86efac", color: "#15803d", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>YES ↑</button>
                    <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#fff1f2", border: "1.5px solid #fda4af", color: "#be123c", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>NO ↓</button>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a8a29e", fontWeight: 600 }}>
                    <span>👥 {m.traders} traders</span>
                    <span style={{ color: m.accent, fontWeight: 700 }}>View market →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — clean editorial ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #f0efec", borderBottom: "1px solid #f0efec", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px" }}>How privacy actually works</h2>
            <p style={{ fontSize: 15, color: "#78716c", margin: 0 }}>Zama FHEVM — compute on encrypted data without decrypting</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              { n: "01", title: "Client encrypt", body: "Bet is encrypted in browser via Zama relayer SDK — nothing leaves in plaintext.", col: "#0d9488", bg: "#f0fdfa" },
              { n: "02", title: "FHE on-chain", body: "FHE.select() routes your bet without revealing side. Math on ciphertext.", col: "#06b6d4", bg: "#ecfeff" },
              { n: "03", title: "Oracle reveal", body: "Only pool totals revealed at close. Individual amounts stay private forever.", col: "#f97316", bg: "#fff7ed" },
              { n: "04", title: "Private payout", body: "ERC-7984 confidentialTransfer. Only your wallet can decrypt your winnings.", col: "#eab308", bg: "#fefce8" },
            ].map(s => (
              <div key={s.n} style={{ background: s.bg, borderRadius: 16, padding: "22px 20px", border: `1px solid ${s.col}20` }}>
                <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: `${s.col}60`, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1c1917", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#78716c" }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ position: "fixed", bottom: 20, right: 20, background: "linear-gradient(135deg, #0d9488, #06b6d4)", color: "#fff", borderRadius: 99, padding: "8px 18px", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 20px rgba(13,148,136,0.3)" }}>
        Design V3 — Aurora Glass
      </div>
    </div>
  );
}
