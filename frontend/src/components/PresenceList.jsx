import React from "react";

export default function PresenceList({ presence, handRaisers, role }) {
  const raisedSet = new Set(handRaisers.map((h) => h.name));
  const total = (presence.teacher ? 1 : 0) + presence.students.length;

  return (
    <div style={s.wrap}>
      {}
      <div style={s.header}>
        <span>👥</span>
        <span>Peserta</span>
        <span style={s.countBadge}>{total}</span>
      </div>

      {}
      <div style={s.list}>
        {}
        {presence.teacher && (
          <div style={s.item}>
            <span style={{ ...s.statusDot, background: "var(--yellow)", boxShadow: "0 0 6px var(--yellow)" }} />
            <span style={s.teacherName}>{presence.teacher}</span>
            <span style={s.roleTag}>Guru</span>
          </div>
        )}

        {presence.students.length === 0 && !presence.teacher && (
          <div style={s.empty}>Belum ada peserta</div>
        )}

        {}
        {presence.students.map((name, i) => (
          <div key={i} style={s.item}>
            <span style={{ ...s.statusDot, background: "var(--green)", boxShadow: "0 0 5px var(--green)" }} />
            <span style={s.studentName}>{name}</span>
            {raisedSet.has(name) && (
              <span style={s.handIcon} title="Raise Hand">✋</span>
            )}
          </div>
        ))}
      </div>

      {}
      {role === "teacher" && handRaisers.length > 0 && (
        <div style={s.handAlert}>
          <span style={{ fontSize: 15 }}>✋</span>
          <div>
            <strong>{handRaisers.map((h) => h.name).join(", ")}</strong>
            {" "}minta bicara
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: {
    padding: "14px 14px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    maxHeight: 240,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 11, fontWeight: 700,
    color: "var(--text2)",
    textTransform: "uppercase", letterSpacing: "0.5px",
    marginBottom: 10,
    flexShrink: 0,
  },
  countBadge: {
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    borderRadius: 20,
    padding: "1px 8px",
    fontSize: 11, fontWeight: 700,
    color: "var(--text)",
  },
  list: {
    overflowY: "auto",
    flex: 1,
    display: "flex", flexDirection: "column", gap: 3,
  },
  item: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "5px 6px",
    borderRadius: "var(--radius-sm)",
    transition: "background 0.1s",
  },
  statusDot: {
    width: 7, height: 7, borderRadius: "50%",
    flexShrink: 0,
  },
  teacherName: {
    fontSize: 13, fontWeight: 700,
    color: "var(--yellow)",
    flex: 1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  studentName: {
    fontSize: 13, color: "var(--text)",
    flex: 1,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  roleTag: {
    fontSize: 10, fontWeight: 700,
    background: "var(--yellow-lo)",
    color: "var(--yellow)",
    borderRadius: 4, padding: "2px 7px",
    flexShrink: 0,
  },
  handIcon: {
    fontSize: 14, flexShrink: 0,
    marginLeft: "auto",
  },
  empty: {
    fontSize: 12, color: "var(--text3)",
    padding: "6px 6px",
  },
  handAlert: {
    display: "flex", alignItems: "center", gap: 8,
    marginTop: 10,
    background: "var(--yellow-lo)",
    border: "1px solid #f59e0b35",
    borderRadius: "var(--radius-sm)",
    padding: "8px 10px",
    fontSize: 13, color: "var(--yellow)", lineHeight: 1.4,
    flexShrink: 0,
  },
};
