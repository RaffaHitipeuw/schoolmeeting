import React, { createContext, useContext } from "react";
import { useWebRTC } from "../hooks/useWebRTC";

const WebRTCCtx = createContext(null);

export function WebRTCProvider({ socket, children }) {
  const webrtc = useWebRTC(socket);
  return <WebRTCCtx.Provider value={webrtc}>{children}</WebRTCCtx.Provider>;
}

export const useWebRTCCtx = () => useContext(WebRTCCtx);
