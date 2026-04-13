import React, { useEffect, useRef } from "react";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoPlayer from "../components/VideoPlayer";
import ChatPanel from "../components/ChatPanel";
import PresenceList from "../components/PresenceList";
import ControlBar from "../components/ControlBar";
import { disconnectSocket } from "../services/socket";

export default function MeetingPage({ onLeave }) {
  const socket            = useSocket();
  const { room, update, reset } = useRoom();
  const webrtc            = useWebRTC(socket);
  const localVideoRef     = useRef(null);

  useEffect(() => {
    
    if (room.role === "teacher") {
      webrtc.startCamera().then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }).catch((err) => {
        console.error("Camera access denied:", err);
        alert("Tidak bisa akses kamera. Pastikan browser punya izin kamera/mikrofon.");
      });
    }

    
    socket.on("presence-update", (presence) => {
      update({ presence });
    });

    
    socket.on("student-joined", ({ studentSocketId }) => {
      if (room.role === "teacher") {
        webrtc.createPeerForStudent(studentSocketId);
      }
    });

    
    socket.on("student-left", ({ studentSocketId }) => {
      
    });

    
    socket.on("webrtc-offer", webrtc.handleOfferAsStudent);

    
    socket.on("webrtc-answer", webrtc.handleAnswer);

    
    socket.on("ice-candidate", webrtc.handleIceCandidate);

    
    socket.on("chat-message", (entry) => {
      update((prev) => ({ chat: [...(prev.chat || []), entry] }));
    });

    
    socket.on("hand-update", ({ socketId, name, raised }) => {
      update((prev) => {
        const list = prev.handRaisers || [];
        if (raised) {
          return {
            handRaisers: [
              ...list.filter((h) => h.socketId !== socketId),
              { socketId, name },
            ],
          };
        }
        return { handRaisers: list.filter((h) => h.socketId !== socketId) };
      });
    });

    
    socket.on("room-closed", ({ reason }) => {
      alert(reason || "Room telah ditutup oleh guru.");
      webrtc.cleanup();
      reset();
      onLeave();
    });

    
    return () => {
      socket.off("presence-update");
      socket.off("student-joined");
      socket.off("student-left");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("chat-message");
      socket.off("hand-update");
      socket.off("room-closed");
    };
    
  }, []);

  function handleLeave() {
    webrtc.cleanup();
    disconnectSocket();
    reset();
    onLeave();
  }

  return (
    <div style={s.page}>

      {}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logoEmoji}>📡</span>
          <span style={s.appName}>School Meeting</span>
          <div style={s.divider} />
          <div style={s.codeBadge}>
            <span style={s.codeLabel}>KODE ROOM</span>
            <span style={s.codeValue}>{room.code}</span>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.roleChip}>
            {room.role === "teacher" ? "👨‍🏫" : "🧑‍🎓"}
            <span>{room.role === "teacher" ? "Guru" : "Siswa"}</span>
          </div>
          <span style={s.userName}>{room.name}</span>
        </div>
      </div>

      {}
      <div style={s.body}>

        {}
        <div style={s.videoCol}>
          <VideoPlayer
            role={room.role}
            localVideoRef={localVideoRef}
            remoteVideoRef={webrtc.remoteVideoRef}
          />
        </div>

        {}
        <div style={s.sidebar}>
          <PresenceList
            presence={room.presence}
            handRaisers={room.handRaisers || []}
            role={room.role}
          />
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

      {}
      <ControlBar
        role={room.role}
        code={room.code}
        name={room.name}
        socket={socket}
        webrtc={webrtc}
        localVideoRef={localVideoRef}
        onLeave={handleLeave}
      />
    </div>
  );
}

const s = {
  page: {
    display: "flex", flexDirection: "column",
    height: "100vh",
    background: "var(--bg)",
    overflow: "hidden",
  },

  
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px",
    height: 54,
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    gap: 12,
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  logoEmoji: { fontSize: 22, lineHeight: 1 },
  appName: { fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-0.3px" },
  divider: { width: 1, height: 20, background: "var(--border2)" },
  codeBadge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: "var(--radius-sm)",
    padding: "4px 12px",
  },
  codeLabel: {
    fontSize: 9, fontWeight: 700, color: "var(--text3)",
    letterSpacing: "1px", textTransform: "uppercase",
  },
  codeValue: {
    fontFamily: "var(--font-mono)", fontWeight: 700,
    color: "var(--accent)", fontSize: 16, letterSpacing: 4,
  },
  roleChip: {
    display: "flex", alignItems: "center", gap: 5,
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 13, color: "var(--text2)",
  },
  userName: { fontWeight: 700, fontSize: 14, color: "var(--text)" },

  
  body: {
    flex: 1, display: "flex",
    overflow: "hidden",
    minHeight: 0,
  },
  videoCol: {
    flex: 1, display: "flex", flexDirection: "column",
    padding: 14,
    overflow: "hidden",
    minWidth: 0,
  },
  sidebar: {
    width: 296, flexShrink: 0,
    display: "flex", flexDirection: "column",
    borderLeft: "1px solid var(--border)",
    overflow: "hidden",
  },
};
