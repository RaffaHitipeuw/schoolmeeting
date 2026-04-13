import React, { useState } from "react";
import { RoomProvider } from "./context/RoomContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [page, setPage] = useState("lobby"); 

  return (
    <RoomProvider>
      <AppRoutes
        page={page}
        onEnter={() => setPage("meeting")}
        onLeave={() => setPage("lobby")}
      />
    </RoomProvider>
  );
}
