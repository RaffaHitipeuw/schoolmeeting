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
