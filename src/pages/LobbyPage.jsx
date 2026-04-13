import React, { useState } from "react";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../hooks/useSocket";

export default function LobbyPage({ onEnter }) {
  const socket = useSocket();
  const { update } = useRoom();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("join");

  const clearErr = () => setError("");

  function handleCreate() {
    if (!name.trim()) return setError("Masukkan nama kamu dulu.");
    setLoading(true);
    socket.emit("create-room", { name: name.trim() }, (res) => {
      setLoading(false);
      if (res?.error) return setError(res.error);
      update({
        code: res.code,
        name: name.trim(),
        role: "host",
        mySocketId: socket.id,
        connected: true,
        existingPeers: [],
        presence: {
          participants: [{ id: socket.id, name: name.trim(), isHost: true }],
          count: 1,
        },
      });
      onEnter();
    });
  }

  function handleJoin() {
    if (!name.trim() || !code.trim()) return setError("Nama dan kode room harus diisi.");
    setLoading(true);
    socket.emit("join-room", { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      setLoading(false);
      if (res?.error) return setError(res.error);
      update({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        role: "participant",
        mySocketId: socket.id,
        presence: res.presence,
        chat: res.chat,
        existingPeers: res.existingPeers || [],
        connected: true,
      });
      onEnter();
    });
  }

  const handleKey = (e) => {
    if (e.key !== "Enter") return;
    tab === "create" ? handleCreate() : handleJoin();
  };

  return (
    <div style={s.page}>
      <div style={s.dotGrid} />
      <div style={{ ...s.orb, ...s.orbBlue }} />
      <div style={{ ...s.orb, ...s.orbPurple }} />

      <div style={s.card} className="animate-fade-up">
        <div style={s.header}>
          <div style={s.iconWrap}>📡</div>
          <div>
            <div style={s.title}>School Meeting</div>
            <div style={s.subtitle}>Video call mesh · Maks 6 peserta · WebRTC</div>
          </div>
        </div>

        {error && (
          <div style={s.errorBox}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={s.fieldGroup}>
          <label style={s.label}>Nama kamu</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); clearErr(); }}
            placeholder="Contoh: Pak Budi / Rani"
            onKeyDown={handleKey}
            autoFocus
          />
        </div>

        <div style={s.tabRow}>
          <button
            style={{ ...s.tabBtn, ...(tab === "join" ? s.tabActive : s.tabInactive) }}
            onClick={() => { setTab("join"); clearErr(); }}
          >
            🧑‍🎓 Bergabung
          </button>
          <button
            style={{ ...s.tabBtn, ...(tab === "create" ? s.tabActive : s.tabInactive) }}
            onClick={() => { setTab("create"); clearErr(); }}
          >
            👑 Buat Room (Host)
          </button>
        </div>

        {tab === "join" && (
          <div className="animate-fade-in">
            <div style={s.fieldGroup}>
              <label style={s.label}>Kode room</label>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); clearErr(); }}
                placeholder="A B 3 K X"
                maxLength={5}
                onKeyDown={handleKey}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: 8, fontSize: 22, textAlign: "center", fontWeight: 700 }}
              />
            </div>
            <button className="btn-primary" style={s.submitBtn} onClick={handleJoin} disabled={loading}>
              {loading ? "Menghubungkan..." : "Masuk Room →"}
            </button>
          </div>
        )}

        {tab === "create" && (
          <div className="animate-fade-in">
            <div style={s.infoBox}>
              <div style={s.infoIcon}>💡</div>
              <div>
                Kamu akan menjadi <strong>host</strong> room ini. Semua peserta bisa saling lihat melalui <strong>WebRTC mesh</strong>. Maks <strong>6 peserta</strong>.
              </div>
            </div>
            <button className="btn-primary" style={s.submitBtn} onClick={handleCreate} disabled={loading}>
              {loading ? "Membuat room..." : "⚡ Buat Room Baru →"}
            </button>
          </div>
        )}

        <div style={s.footer}>WebRTC mesh · End-to-end · Tidak perlu akun</div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" },
  dotGrid: { position: "absolute", inset: 0, zIndex: 0, backgroundImage: "radial-gradient(circle, #1e2740 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.6 },
  orb: { position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.12, pointerEvents: "none" },
  orbBlue: { width: 500, height: 500, background: "var(--accent)", top: "-150px", right: "-100px" },
  orbPurple: { width: 400, height: 400, background: "var(--purple)", bottom: "-120px", left: "-80px" },
  card: { position: "relative", zIndex: 1, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--radius-xl)", padding: "36px 32px", width: 430, boxShadow: "0 0 0 1px rgba(255,255,255,0.03), var(--shadow-lg)" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--border)" },
  iconWrap: { fontSize: 32, background: "linear-gradient(135deg, var(--accent-lo), #8b5cf620)", border: "1px solid var(--border2)", borderRadius: "var(--radius)", padding: "10px 14px", lineHeight: 1 },
  title: { fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" },
  subtitle: { fontSize: 12, color: "var(--text2)", marginTop: 3 },
  errorBox: { display: "flex", alignItems: "center", gap: 10, background: "var(--red-lo)", border: "1px solid #ef444440", borderRadius: "var(--radius)", padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 18 },
  fieldGroup: { marginBottom: 18 },
  label: { display: "block", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 },
  tabRow: { display: "flex", gap: 6, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, borderRadius: "var(--radius-sm)", padding: "9px 8px", fontSize: 13, transition: "all 0.15s var(--ease)", justifyContent: "center" },
  tabActive: { background: "var(--surface3)", color: "var(--text)", border: "1px solid var(--border2)", boxShadow: "var(--shadow-sm)" },
  tabInactive: { background: "none", color: "var(--text2)", border: "1px solid transparent" },
  infoBox: { display: "flex", gap: 12, alignItems: "flex-start", background: "var(--accent-lo)", border: "1px solid #3b82f625", borderRadius: "var(--radius)", padding: "13px 14px", fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 18 },
  infoIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  submitBtn: { width: "100%", padding: "13px 20px", fontSize: 15, justifyContent: "center", marginBottom: 4 },
  footer: { marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--text3)", letterSpacing: "0.3px" },
};
