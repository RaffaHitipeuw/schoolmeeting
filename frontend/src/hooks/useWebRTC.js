import { useRef, useCallback, useState } from "react";
import { STUN_CONFIG } from "../utils/constants";

export function useWebRTC(socket) {
  const localStreamRef = useRef(null);
  const peerMap = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState({});
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const speakingTimers = useRef({});

  function updateRemoteStream(socketId, stream) {
    setRemoteStreams((prev) => {
      if (!stream) {
        const next = { ...prev };
        delete next[socketId];
        return next;
      }
      return { ...prev, [socketId]: stream };
    });
  }

  function removePeer(socketId) {
    const pc = peerMap.current.get(socketId);
    if (pc) {
      pc.close();
      peerMap.current.delete(socketId);
    }
    updateRemoteStream(socketId, null);
    clearTimeout(speakingTimers.current[socketId]);
    delete speakingTimers.current[socketId];
  }

  function createPeer(targetId, isInitiator) {
    if (peerMap.current.has(targetId)) {
      peerMap.current.get(targetId).close();
      peerMap.current.delete(targetId);
    }

    const pc = new RTCPeerConnection(STUN_CONFIG);
    peerMap.current.set(targetId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { targetId, candidate });
    };

    pc.ontrack = ({ streams }) => {
      if (streams?.[0]) {
        updateRemoteStream(targetId, streams[0]);
        setupAudioAnalysis(targetId, streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        updateRemoteStream(targetId, null);
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { targetId, offer });
        } catch (e) {
          console.warn("[WebRTC] offer failed:", e);
        }
      };
    }

    return pc;
  }

  function setupAudioAnalysis(socketId, stream) {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      function check() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const speaking = avg > 15;
        if (speaking) {
          setActiveSpeaker(socketId);
          clearTimeout(speakingTimers.current[socketId]);
          speakingTimers.current[socketId] = setTimeout(() => {
            setActiveSpeaker((prev) => (prev === socketId ? null : prev));
          }, 1500);
        }
        if (stream.active) requestAnimationFrame(check);
        else ctx.close();
      }
      check();
    } catch (_) {}
  }

  const startCamera = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    localStreamRef.current = stream;
    setIsScreenSharing(false);

    for (const pc of peerMap.current.values()) {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) sender.replaceTrack(track);
        else pc.addTrack(track, stream);
      });
    }

    return stream;
  }, []);

  const startScreenShare = useCallback(async () => {
    const screen = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false,
    });
    const videoTrack = screen.getVideoTracks()[0];

    for (const pc of peerMap.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(videoTrack);
    }

    videoTrack.addEventListener("ended", async () => {
      const cam = await startCamera();
      const camTrack = cam.getVideoTracks()[0];
      for (const pc of peerMap.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
    });

    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const combined = new MediaStream([videoTrack, ...audioTracks]);
      localStreamRef.current = combined;
    } else {
      localStreamRef.current = screen;
    }

    setIsScreenSharing(true);
    return localStreamRef.current;
  }, [startCamera]);

  const initiateCallTo = useCallback(
    async (targetId) => {
      const pc = createPeer(targetId, true);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { targetId, offer });
      } catch (e) {
        console.warn("[WebRTC] initiateCallTo failed:", e);
      }
    },
    [socket]
  );

  const handleOffer = useCallback(
    async ({ fromId, offer }) => {
      const pc = createPeer(fromId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { targetId: fromId, answer });
      } catch (e) {
        console.warn("[WebRTC] handleOffer failed:", e);
      }
    },
    [socket]
  );

  const handleAnswer = useCallback(async ({ fromId, answer }) => {
    const pc = peerMap.current.get(fromId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) {
        console.warn("[WebRTC] handleAnswer failed:", e);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ fromId, candidate }) => {
    const pc = peerMap.current.get(fromId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    }
  }, []);

  const cleanup = useCallback(() => {
    for (const [id] of peerMap.current) removePeer(id);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setRemoteStreams({});
    setActiveSpeaker(null);
  }, []);

  return {
    localStreamRef,
    remoteStreams,
    activeSpeaker,
    isScreenSharing,
    startCamera,
    startScreenShare,
    initiateCallTo,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    cleanup,
  };
}
