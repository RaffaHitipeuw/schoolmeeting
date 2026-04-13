import React from "react";

export default function RaiseHandBtn({ raised, onToggle }) {
  return (
    <button
      className={raised ? "btn-yellow" : "btn-ghost"}
      onClick={onToggle}
      style={{ padding: "9px 16px" }}
      title={raised ? "Turunkan tangan" : "Minta izin bicara"}
    >
      ✋ {raised ? "Turunkan Tangan" : "Raise Hand"}
    </button>
  );
}
