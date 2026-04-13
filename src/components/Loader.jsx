import React from "react";

export default function Loader({ text = "Memuat..." }) {
  return (
    <div style={s.wrap}>
      <div style={s.ring}>
        <div style={s.spinner} />
      </div>
      <span style={s.text}>{text}</span>
    </div>
  );
}

const s = {
  wrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 16,
    height: "100%",
    background: "var(--bg)",
  },
  ring: {
    width: 44, height: 44,
    position: "relative",
  },
  spinner: {
    position: "absolute", inset: 0,
    border: "3px solid var(--border2)",
    borderTop: "3px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },
  text: {
    color: "var(--text2)", fontSize: 14, fontWeight: 500,
  },
};
