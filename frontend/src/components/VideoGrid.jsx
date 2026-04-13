import React, { useEffect, useRef } from "react";

function VideoTile({ stream, name, isLocal, isActiveSpeaker, isMuted, isCamOff, isHost }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      style={{
        ...s.tile,
        ...(isActiveSpeaker ? s.tileActive : {}),
      }}
    >
      {stream && !isCamOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={s.video}
        />
      ) : (
        <div style={s.avatarWrap}>
          <div style={s.avatar}>{name?.[0]?.toUpperCase() || "?"}</div>
        </div>
      )}

      <div style={s.nameBadge}>
        {isMuted && <span style={s.mutedIcon}>🔇</span>}
        <span>{isLocal ? `${name} (Kamu)` : name}</span>
        {isHost && <span style={s.hostTag}>Host</span>}
      </div>

      {isActiveSpeaker && <div style={s.speakingRing} />}
    </div>
  );
}

export default function VideoGrid({
  localStream,
  localName,
  localIsHost,
  localMuted,
  localCamOff,
  remoteStreams,
  presence,
  activeSpeaker,
  mySocketId,
}) {
  const count = presence.participants.length;

  function getGridStyle() {
    if (count <= 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
    if (count === 2) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
    if (count <= 4) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
    return { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr" };
  }

  return (
    <div style={{ ...s.grid, ...getGridStyle() }}>
      {presence.participants.map((p) => {
        const isLocal = p.id === mySocketId;
        const stream = isLocal ? localStream : remoteStreams[p.id];
        const isActiveSpeaker = activeSpeaker === p.id;

        return (
          <VideoTile
            key={p.id}
            stream={stream}
            name={p.name}
            isLocal={isLocal}
            isActiveSpeaker={isActiveSpeaker}
            isMuted={isLocal ? localMuted : false}
            isCamOff={isLocal ? localCamOff : false}
            isHost={p.isHost}
          />
        );
      })}
    </div>
  );
}

const s = {
  grid: {
    display: "grid",
    gap: 8,
    width: "100%",
    height: "100%",
    padding: 4,
  },
  tile: {
    position: "relative",
    background: "#050810",
    borderRadius: "var(--radius-lg)",
    border: "2px solid var(--border)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
  },
  tileActive: {
    borderColor: "#22c55e",
    boxShadow: "0 0 0 2px #22c55e40, 0 0 20px #22c55e20",
    transform: "scale(1.01)",
    zIndex: 1,
  },
  speakingRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    border: "2px solid #22c55e",
    animation: "speakPulse 0.8s ease-in-out infinite",
    pointerEvents: "none",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #0f1520, #161d2e)",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent), var(--purple))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    flexShrink: 0,
  },
  nameBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    maxWidth: "calc(100% - 20px)",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  mutedIcon: { fontSize: 11 },
  hostTag: {
    background: "var(--accent)",
    color: "#fff",
    borderRadius: 4,
    padding: "1px 5px",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
};
