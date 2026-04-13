import React, { useEffect } from "react";

export default function VideoPlayer({ role, localVideoRef, remoteVideoRef }) {
  
  useEffect(() => {
    if (role !== "student") return;
    const videoEl = remoteVideoRef?.current;
    if (!videoEl) return;

    function onPlay() {
      const overlay = document.getElementById("waiting-overlay");
      if (overlay) overlay.style.display = "none";
    }
    videoEl.addEventListener("play", onPlay);
    return () => videoEl.removeEventListener("play", onPlay);
  }, [role, remoteVideoRef]);

  return (
    <div style={s.wrap}>
      {role === "teacher" ? (
        
        <>
          <video
            ref={localVideoRef}
            style={s.video}
            autoPlay
            muted        
            playsInline
          />
          <div style={s.liveBadge}>
            <span style={s.liveDot} />
            LIVE
          </div>
          <div style={s.teacherLabel}>Kamu sedang ditampilkan ke semua siswa</div>
        </>
      ) : (
        
        <>
          <video
            ref={remoteVideoRef}
            style={s.video}
            autoPlay
            playsInline
          />
          {}
          <div id="waiting-overlay" style={s.waitOverlay}>
            <div style={s.waitPulse}>📡</div>
            <div style={s.waitTitle}>Menunggu guru memulai</div>
            <div style={s.waitSub}>Stream akan muncul otomatis saat guru siap</div>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  wrap: {
    flex: 1,
    position: "relative",
    background: "#050810",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },

  
  liveBadge: {
    position: "absolute", top: 14, left: 14,
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 12px",
    fontSize: 11, fontWeight: 700, color: "#fff",
    letterSpacing: "1.5px",
  },
  liveDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 6px #ef4444",
    animation: "pulse 1.5s ease-in-out infinite",
    display: "inline-block",
  },
  teacherLabel: {
    position: "absolute", bottom: 14,
    left: "50%", transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius)",
    padding: "6px 16px",
    fontSize: 12, color: "var(--text2)",
    whiteSpace: "nowrap",
  },

  
  waitOverlay: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 12,
    background: "var(--surface)",
  },
  waitPulse: {
    fontSize: 56, lineHeight: 1,
    animation: "pulse 2s ease-in-out infinite",
  },
  waitTitle: {
    fontSize: 17, fontWeight: 700, color: "var(--text)",
  },
  waitSub: {
    fontSize: 13, color: "var(--text2)",
  },
};
