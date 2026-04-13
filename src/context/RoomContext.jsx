import React, { createContext, useContext, useState, useCallback } from "react";

const RoomCtx = createContext(null);

const INITIAL_STATE = {
  code: null,
  name: "",
  mySocketId: null,
  role: null,
  presence: { participants: [], count: 0 },
  chat: [],
  existingPeers: [],
  connected: false,
};

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(INITIAL_STATE);

  const update = useCallback((patch) => {
    setRoom((prev) =>
      typeof patch === "function"
        ? { ...prev, ...patch(prev) }
        : { ...prev, ...patch }
    );
  }, []);

  const reset = useCallback(() => setRoom(INITIAL_STATE), []);

  return (
    <RoomCtx.Provider value={{ room, update, reset }}>
      {children}
    </RoomCtx.Provider>
  );
}

export const useRoom = () => useContext(RoomCtx);
