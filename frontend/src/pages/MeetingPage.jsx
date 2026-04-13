import React, { useEffect, useRef, useState } from "react";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoGrid from "../components/VideoGrid";
import ChatPanel from "../components/ChatPanel";
import ControlBar from "../components/ControlBar";
import { disconnectSocket } from "../services/socket";

export default function MeetingPage({ onLeave }) {
  const socket = useSocket();
  const { room, update, reset } = useRoom();
  const webrtc = useWebRTC(socket);
  const [localStream, setLocalStream] = useState(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const existingPeersCalledRef = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        const stream = await webrtc.startCamera();
        setLocalStream(stream);

        if (!existingPeersCalledRef.current && room.existingPeers?.length > 0) {
          existingPeersCalledRef.current = true;
          for (const peerId of room.existingPeers) {
            await webrtc.initiateCallTo(peerId);
          }
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
    init();

    socket.on("peer-joined", ({ socketId }) => {
      setTimeout(() => webrtc.initiateCallTo(socketId), 300);
    });

    socket.on("peer-left", ({ socketId }) => {
      webrtc.removePeer(socketId);
    });

    socket.on("webrtc-offer", webrtc.handleOffer);
    socket.on("webrtc-answer", webrtc.handleAnswer);
    socket.on("ice-candidate", webrtc.handleIceCandidate);

    socket.on("presence-update", (presence) => {
      update({ presence });
    });

    socket.on("chat-message", (entry) => {
      update((prev) => ({ chat: [...(prev.chat || []), entry] }));
    });

    socket.on("force-mute", () => {
      const stream = webrtc.localStreamRef?.current;
      if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = false));
    });

    socket.on("you-were-kicked", () => {
      alert("Kamu telah dikeluarkan dari room oleh host.");
      webrtc.cleanup();
      disconnectSocket();
      reset();
      onLeave();
    });

    socket.on("room-closed", ({ reason }) => {
      alert(reason || "Room telah ditutup.");
      webrtc.cleanup();
      disconnectSocket();
      reset();
      onLeave();
    });

    socket.on("disconnect", () => {
      setIsDisconnected(true);
    });

    socket.on("connect", () => {
      setIsDisconnected(false);
    });

    return () => {
      socket.off("peer-joined");
      socket.off("peer-left");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("presence-update");
      socket.off("chat-message");
      socket.off("force-mute");
      socket.off("you-were-kicked");
      socket.off("room-closed");
      socket.off("disconnect");
      socket.off("connect");
    };
  }, []);

  async function handleScreenShare() {
    try {
      if (webrtc.isScreenSharing) {
        const stream = await webrtc.startCamera();
        setLocalStream(stream);
      } else {
        const stream = await webrtc.startScreenShare();
        setLocalStream(stream);
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") alert("Gagal screen share: " + err.message);
    }
  }

  function handleLeave() {
    webrtc.cleanup();
    disconnectSocket();
    reset();
    onLeave();
  }

  function handleReconnect() {
    socket.connect();
    setIsDisconnected(false);
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>📡</span>
          <span style={s.appName}>School Meeting</span>
          <div style={s.divider} />
          <div style={s.codeBadge}>
            <span style={s.codeLabel}>KODE</span>
            <span style={s.codeValue}>{room.code}</span>
          </div>
          {isDisconnected && (
            <div style={s.reconnectBanner}>
              <span>⚠️ Terputus</span>
              <button className="btn-primary" onClick={handleReconnect} style={s.reconnectBtn}>
                Reconnect
              </button>
            </div>
          )}
        </div>
        <div style={s.headerRight}>
          <div style={s.roleChip}>
            {room.role === "host" ? "👑" : "🧑‍🎓"}
            <span>{room.role === "host" ? "Host" : "Peserta"}</span>
          </div>
          <span style={s.userName}>{room.name}</span>
          <span style={s.countBadge}>👥 {room.presence.count}</span>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.videoArea}>
          <VideoGrid
            localStream={localStream}
            localName={room.name}
            localIsHost={room.role === "host"}
            localMuted={false}
            localCamOff={false}
            remoteStreams={webrtc.remoteStreams}
            presence={room.presence}
            activeSpeaker={webrtc.activeSpeaker}
            mySocketId={room.mySocketId}
          />
        </div>

        <div style={s.sidebar}>
          <ChatPanel
            messages={room.chat}
            myName={room.name}
            onSend={(msg) =>
              socket.emit("chat-message", {
                code: room.code,
                name: room.name,
                message: msg,
              })
            }
          />
        </div>
      </div>

      <ControlBar
        role={room.role}
        code={room.code}
        name={room.name}
        socket={socket}
        localStreamRef={webrtc.localStreamRef}
        isScreenSharing={webrtc.isScreenSharing}
        onScreenShare={handleScreenShare}
        onLeave={handleLeave}
        presence={room.presence}
        mySocketId={room.mySocketId}
      />
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "var(--bg)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 54,
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    gap: 12,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 22, lineHeight: 1 },
  appName: { fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-0.3px" },
  divider: { width: 1, height: 20, background: "var(--border2)" },
  codeBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 12px",
  },
  codeLabel: { fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: "1px", textTransform: "uppercase" },
  codeValue: { fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", fontSize: 16, letterSpacing: 4 },
  reconnectBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--red-lo)",
    border: "1px solid #ef444440",
    borderRadius: "var(--radius-sm)",
    padding: "4px 10px",
    fontSize: 12,
    color: "#f87171",
  },
  reconnectBtn: { padding: "3px 10px", fontSize: 11 },
  roleChip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 13,
    color: "var(--text2)",
  },
  userName: { fontWeight: 700, fontSize: 14, color: "var(--text)" },
  countBadge: {
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    color: "var(--text2)",
  },
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    minHeight: 0,
  },
  videoArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 10,
    overflow: "hidden",
    minWidth: 0,
  },
  sidebar: {
    width: 296,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid var(--border)",
    overflow: "hidden",
  },
};
