import React from "react";
import LobbyPage from "../pages/LobbyPage";
import MeetingPage from "../pages/MeetingPage";

export default function AppRoutes({ page, onEnter, onLeave }) {
  if (page === "meeting") {
    return <MeetingPage onLeave={onLeave} />;
  }
  return <LobbyPage onEnter={onEnter} />;
}
