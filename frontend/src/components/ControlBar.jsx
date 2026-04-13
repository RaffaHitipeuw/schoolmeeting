import React, { useState, useRef } from "react";

export default function ControlBar({
  role,
  code,
  name,
  socket,
  webrtc,
  localVideoRef,
  onLeave,
}) {
  const [sharing, setSharing]   = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff]     = useState(false);
  const [handUp, setHandUp]     = useState(false);
  const [copied, setCopied]     = useState(false);

  
  async function toggleScreenShare() {
    if (!sharing) {
      try {
        const stream = await webrtc.startScreenShare();
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setSharing(true);
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          alert("Gagal screen share: " + err.message);
        }
      }
    } else {
      const stream = await webrtc.startCamera();
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setSharing(false);
    }
  }

  
  function toggleMic() {
    const stream = webrtc.localStreamRef?.current;
    if (!stream) return;
    const next = !micMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMicMuted(next);
  }

  
  function toggleCamera() {
    const stream = webrtc.localStreamRef?.current;
    if (!stream) return;
    const next = !camOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCamOff(next);
  }

  
  function toggleHand() {
    const raised = !handUp;
    setHandUp(raised);
    socket.emit("raise-hand", { code, name, raised });
  }

  
  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={s.bar}>
      {}
      <div style={s.group}>
        {role === "teacher" && (
          <>
            <BarBtn
              active={!micMuted}
              activeClass="btn-ghost"
              inactiveClass="btn-danger"
              onClick={toggleMic}
              label={micMuted ? "🔇 Mic Off" : "🎙 Mic On"}
              title={micMuted ? "Aktifkan mikrofon" : "Matikan mikrofon"}
            />
            <BarBtn
              active={!camOff}
              activeClass="btn-ghost"
              inactiveClass="btn-danger"
              onClick={toggleCamera}
              label={camOff ? "📷 Cam Off" : "📹 Cam On"}
              title={camOff ? "Aktifkan kamera" : "Matikan kamera"}
            />
            <BarBtn
              active={sharing}
              activeClass="btn-success"
              inactiveClass="btn-ghost"
              onClick={toggleScreenShare}
              label={sharing ? "⏹ Stop Share" : "🖥 Share Layar"}
              title={sharing ? "Hentikan screen share" : "Mulai screen share"}
            />
          </>
        )}

        {role === "student" && (
          <BarBtn
            active={handUp}
            activeClass="btn-yellow"
            inactiveClass="btn-ghost"
            onClick={toggleHand}
            label={handUp ? "✋ Turunkan Tangan" : "✋ Raise Hand"}
            title={handUp ? "Turunkan tangan" : "Minta izin bicara"}
          />
        )}
      </div>

      {}
      <div style={s.center}>
        {role === "teacher" && (
          <button
            className="btn-ghost"
            onClick={copyCode}
            style={s.copyBtn}
            title="Salin kode room"
          >
            <span style={s.copyLabel}>Kode Room:</span>
            <span style={s.copyCode}>{code}</span>
            <span style={s.copyIcon}>{copied ? "✅" : "📋"}</span>
          </button>
        )}
      </div>

      {}
      <div style={s.group}>
        <button
          className="btn-danger"
          onClick={onLeave}
          style={{ padding: "9px 20px" }}
          title="Keluar dari room"
        >
          🚪 Keluar
        </button>
      </div>
    </div>
  );
}

function BarBtn({ active, activeClass, inactiveClass, onClick, label, title }) {
  return (
    <button
      className={active ? activeClass : inactiveClass}
      onClick={onClick}
      title={title}
      style={{ padding: "9px 14px" }}
    >
      {label}
    </button>
  );
}

const s = {
  bar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12,
    padding: "10px 20px",
    background: "var(--surface)",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  group: {
    display: "flex", alignItems: "center", gap: 8,
  },
  center: {
    flex: 1, display: "flex", justifyContent: "center",
  },
  copyBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px",
    cursor: "pointer",
  },
  copyLabel: {
    fontSize: 11, color: "var(--text3)", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  copyCode: {
    fontFamily: "var(--font-mono)",
    fontWeight: 700, fontSize: 15,
    color: "var(--accent)",
    letterSpacing: 4,
  },
  copyIcon: { fontSize: 14 },
};
