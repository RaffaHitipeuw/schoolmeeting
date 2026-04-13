import { useRef, useCallback } from "react";
import { STUN_CONFIG } from "../utils/constants";
import { peerMap, closeAllPeers } from "../services/webrtc";


export function useWebRTC(socket) {
  const localStreamRef  = useRef(null);  
  const remoteVideoRef  = useRef(null);  

  
  const startCamera = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  
  const startScreenShare = useCallback(async () => {
    const screen = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false,
    });
    const videoTrack = screen.getVideoTracks()[0];

    
    for (const pc of peerMap.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(videoTrack);
    }

    
    videoTrack.addEventListener("ended", async () => {
      const cam = await startCamera();
      const camTrack = cam.getVideoTracks()[0];
      for (const pc of peerMap.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
      }
    });

    localStreamRef.current = screen;
    return screen;
  }, [startCamera]);

  
  const createPeerForStudent = useCallback(
    async (studentSocketId) => {
      if (peerMap.has(studentSocketId)) return; 

      const pc = new RTCPeerConnection(STUN_CONFIG);
      peerMap.set(studentSocketId, pc);

      
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("ice-candidate", { targetId: studentSocketId, candidate });
        }
      };

      
      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          peerMap.delete(studentSocketId);
        }
      };

      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { targetId: studentSocketId, offer });
    },
    [socket]
  );

  
  const handleOfferAsStudent = useCallback(
    async ({ fromId, offer }) => {
      const pc = new RTCPeerConnection(STUN_CONFIG);
      peerMap.set(fromId, pc);

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("ice-candidate", { targetId: fromId, candidate });
        }
      };

      
      pc.ontrack = ({ streams }) => {
        if (remoteVideoRef.current && streams?.[0]) {
          remoteVideoRef.current.srcObject = streams[0];
          
          const overlay = document.getElementById("waiting-overlay");
          if (overlay) overlay.style.display = "none";
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { targetId: fromId, answer });
    },
    [socket]
  );

  
  const handleAnswer = useCallback(async ({ fromId, answer }) => {
    const pc = peerMap.get(fromId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.warn("[WebRTC] setRemoteDescription answer failed:", e);
      }
    }
  }, []);

  
  const handleIceCandidate = useCallback(async ({ fromId, candidate }) => {
    const pc = peerMap.get(fromId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        
      }
    }
  }, []);

  
  const cleanup = useCallback(() => {
    closeAllPeers();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }, []);

  return {
    localStreamRef,
    remoteVideoRef,
    startCamera,
    startScreenShare,
    createPeerForStudent,
    handleOfferAsStudent,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  };
}
