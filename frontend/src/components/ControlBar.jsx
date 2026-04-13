import React, { useState } from "react";

export default function ControlBar({
  role,
  code,
  name,
  socket,
  localStreamRef,
  isScreenSharing,
  onScreenShare,
  onLeave,
  presence,
  mySocketId,
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  function toggleMic() {
    const stream = localStreamRef?.current;
    if (!stream) return;
    const next = !micMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMicMuted(next);
  }

  function toggleCamera() {
    const stream = localStreamRef?.current;
    if (!stream) return;
    const next = !camOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCamOff(next);
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function muteAll() {
    socket.emit("mute-all", { code });
  }

  function kickUser(targetId) {
    socket.emit("kick-user", { code, targetId });
    setShowParticipants(false);
  }

  const isHost = role === "host";
  const others = presence.participants.filter((p) => p.id !== mySocketId && !p.isHost);

  return (
    <div style={s.bar}>
      <div style={s.group}>
        <BarBtn
          active={!micMuted}
          activeIcon="🎙"
          inactiveIcon="🔇"
          activeLabel="Mic On"
          inactiveLabel="Mic Off"
          activeClass="btn-ghost"
          inactiveClass="btn-danger"
          onClick={toggleMic}
        />
        <BarBtn
          active={!camOff}
          activeIcon="📹"
          inactiveIcon="📷"
          activeLabel="Cam On"
          inactiveLabel="Cam Off"
          activeClass="btn-ghost"
          inactiveClass="btn-danger"
          onClick={toggleCamera}
        />
        <BarBtn
          active={isScreenSharing}
          activeIcon="⏹"
          inactiveIcon="🖥"
          activeLabel="Stop Share"
          inactiveLabel="Share Layar"
          activeClass="btn-success"
          inactiveClass="btn-ghost"
          onClick={onScreenShare}
        />
      </div>

      <div style={s.center}>
        <button className="btn-ghost" onClick={copyCode} style={s.copyBtn} title="Salin kode room">
          <span style={s.codeLabel}>KODE:</span>
          <span style={s.codeVal}>{code}</span>
          <span>{copied ? "✅" : "📋"}</span>
        </button>
      </div>

      <div style={s.group}>
        {isHost && (
          <>
            <button className="btn-ghost" onClick={muteAll} title="Mute semua peserta" style={s.hostBtn}>
              🔇 Mute All
            </button>
            <div style={{ position: "relative" }}>
              <button
                className="btn-ghost"
                onClick={() => setShowParticipants((v) => !v)}
                title="Kelola peserta"
                style={s.hostBtn}
              >
                👥 Kelola ({presence.count})
              </button>
              {showParticipants && others.length > 0 && (
                <div style={s.dropdown}>
                  {others.map((p) => (
                    <div key={p.id} style={s.dropItem}>
                      <span style={s.dropName}>{p.name}</span>
                      <button
                        className="btn-danger"
                        onClick={() => kickUser(p.id)}
                        style={s.kickBtn}
                      >
                        Kick
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showParticipants && others.length === 0 && (
                <div style={s.dropdown}>
                  <div style={s.dropEmpty}>Tidak ada peserta lain</div>
                </div>
              )}
            </div>
          </>
        )}
        <button className="btn-danger" onClick={onLeave} style={{ padding: "9px 20px" }} title="Keluar dari room">
          🚪 Keluar
        </button>
      </div>
    </div>
  );
}

function BarBtn({ active, activeIcon, inactiveIcon, activeLabel, inactiveLabel, activeClass, inactiveClass, onClick }) {
  return (
    <button
      className={active ? activeClass : inactiveClass}
      onClick={onClick}
      style={{ padding: "9px 14px" }}
    >
      {active ? activeIcon : inactiveIcon}{" "}
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

const s = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 20px",
    background: "var(--surface)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
    position: "relative",
    zIndex: 10,
  },
  group: { display: "flex", alignItems: "center", gap: 8 },
  center: { flex: 1, display: "flex", justifyContent: "center" },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    cursor: "pointer",
  },
  codeLabel: { fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" },
  codeVal: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--accent)", letterSpacing: 4 },
  hostBtn: { padding: "9px 14px" },
  dropdown: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    right: 0,
    background: "var(--surface2)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius)",
    padding: 8,
    minWidth: 220,
    boxShadow: "var(--shadow-lg)",
    zIndex: 100,
  },
  dropItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    gap: 10,
  },
  dropName: { fontSize: 13, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  kickBtn: { padding: "4px 10px", fontSize: 12, flexShrink: 0 },
  dropEmpty: { fontSize: 12, color: "var(--text3)", padding: "6px 8px", textAlign: "center" },
};
