import React, { useState, useEffect, useRef } from "react";
import { formatTime } from "../utils/helpers";

export default function ChatPanel({ messages, myName, onSend }) {
  const [input, setInput]   = useState("");
  const bottomRef           = useRef(null);
  const inputRef            = useRef(null);

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const msg = input.trim();
    if (!msg) return;
    onSend(msg);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div style={s.wrap}>
      {}
      <div style={s.header}>
        <span>💬</span> Chat
        {messages.length > 0 && (
          <span style={s.msgCount}>{messages.length}</span>
        )}
      </div>

      {}
      <div style={s.messageList}>
        {messages.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div>Belum ada pesan</div>
          </div>
        )}

        {messages.map((m, i) => {
          const isMe = m.senderName === myName;
          return (
            <div
              key={m.id || i}
              style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}
            >
              {!isMe && <div style={s.senderName}>{m.senderName}</div>}
              <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                {m.message}
              </div>
              <div style={{ ...s.timeStamp, ...(isMe ? { textAlign: "right" } : {}) }}>
                {formatTime(m.time)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {}
      <div style={s.inputArea}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ketik pesan..."
          style={s.textInput}
          maxLength={500}
        />
        <button
          className="btn-primary"
          onClick={send}
          style={s.sendBtn}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flex: 1,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  header: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
    fontSize: 11, fontWeight: 700,
    color: "var(--text2)",
    textTransform: "uppercase", letterSpacing: "0.5px",
    flexShrink: 0,
  },
  msgCount: {
    marginLeft: "auto",
    background: "var(--accent)",
    color: "#fff",
    borderRadius: 20,
    padding: "1px 7px",
    fontSize: 10,
    fontWeight: 700,
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 12px",
    display: "flex", flexDirection: "column",
    gap: 8,
  },
  emptyState: {
    textAlign: "center",
    color: "var(--text3)",
    fontSize: 13,
    marginTop: "auto",
    marginBottom: "auto",
    paddingTop: 40,
  },
  msgRow: {
    display: "flex", flexDirection: "column",
    gap: 2,
    alignItems: "flex-start",
    maxWidth: "86%",
  },
  msgRowMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  senderName: {
    fontSize: 10, fontWeight: 700,
    color: "var(--accent)",
    paddingLeft: 4,
    letterSpacing: "0.3px",
  },
  bubble: {
    padding: "8px 12px",
    borderRadius: "var(--radius)",
    fontSize: 13, lineHeight: 1.55,
    wordBreak: "break-word",
    maxWidth: "100%",
  },
  bubbleThem: {
    background: "var(--surface3)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    borderTopLeftRadius: "var(--radius-sm)",
  },
  bubbleMe: {
    background: "var(--accent)",
    color: "#fff",
    borderTopRightRadius: "var(--radius-sm)",
  },
  timeStamp: {
    fontSize: 10,
    color: "var(--text3)",
    paddingLeft: 4,
  },
  inputArea: {
    display: "flex", gap: 8,
    padding: "10px 10px",
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: "9px 12px",
    fontSize: 13,
  },
  sendBtn: {
    flexShrink: 0,
    padding: "9px 14px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: "var(--radius)",
  },
};
