import { STUN_CONFIG } from "../utils/constants";


export const peerMap = new Map();

export function createPeerConnection(targetId, socket, onRemoteStream = null) {
  const pc = new RTCPeerConnection(STUN_CONFIG);

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit("ice-candidate", { targetId, candidate });
  };

  if (onRemoteStream) {
    pc.ontrack = ({ streams }) => {
      if (streams?.[0]) onRemoteStream(streams[0]);
    };
  }

  pc.onconnectionstatechange = () => {
    if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
      peerMap.delete(targetId);
    }
  };

  peerMap.set(targetId, pc);
  return pc;
}

export function closePeer(targetId) {
  const pc = peerMap.get(targetId);
  if (pc) {
    pc.close();
    peerMap.delete(targetId);
  }
}

export function closeAllPeers() {
  for (const pc of peerMap.values()) pc.close();
  peerMap.clear();
}
