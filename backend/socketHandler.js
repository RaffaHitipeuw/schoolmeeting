const rm = require("./roomManager");

function registerHandlers(io, socket) {
  console.log(`[connect] ${socket.id}`);

  socket.on("create-room", ({ name }, cb) => {
    if (!name?.trim()) return cb({ error: "Nama tidak boleh kosong." });
    const code = rm.createRoom(socket.id, name.trim());
    socket.join(code);
    console.log(`[room:create] ${code} by ${name}`);
    cb({ code });
  });

  socket.on("join-room", ({ code, name }, cb) => {
    if (!name?.trim() || !code?.trim()) return cb({ error: "Nama dan kode harus diisi." });
    const result = rm.joinRoom(code.trim().toUpperCase(), socket.id, name.trim());
    if (result.error) return cb({ error: result.error });

    const room = result.room;
    socket.join(code);

    const presence = rm.getPresence(room);
    cb({
      ok: true,
      presence,
      chat: room.chat,
      teacherSocketId: room.teacher?.id || null,
    });

    socket.to(code).emit("presence-update", presence);

    if (room.teacher && room.teacher.id !== socket.id) {
      io.to(room.teacher.id).emit("student-joined", {
        studentSocketId: socket.id,
        name: name.trim(),
      });
    }

    console.log(`[room:join] ${name} → ${code}`);
  });


  socket.on("webrtc-offer", ({ targetId, offer }) => {
    io.to(targetId).emit("webrtc-offer", { fromId: socket.id, offer });
  });

  socket.on("webrtc-answer", ({ targetId, answer }) => {
    io.to(targetId).emit("webrtc-answer", { fromId: socket.id, answer });
  });

  socket.on("ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("ice-candidate", { fromId: socket.id, candidate });
  });

  socket.on("chat-message", ({ code, name, message }) => {
    if (!message?.trim()) return;
    const entry = rm.addChat(code, name, message.trim());
    if (entry) io.to(code).emit("chat-message", entry);
  });

  socket.on("raise-hand", ({ code, name, raised }) => {
    const room = rm.getRoom(code);
    if (!room) return;
    rm.setHandRaise(code, socket.id, raised);
    if (room.teacher) {
      io.to(room.teacher.id).emit("hand-update", {
        socketId: socket.id,
        name,
        raised,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);
    const result = rm.removeParticipant(socket.id);
    if (!result) return;

    if (result.closed) {
      io.to(result.code).emit("room-closed", { reason: "Guru telah menutup room." });
      console.log(`[room:closed] ${result.code}`);
    } else {
      const room = rm.getRoom(result.code);
      if (room) {
        const presence = rm.getPresence(room);
        io.to(result.code).emit("presence-update", presence);
        if (room.teacher) {
          io.to(room.teacher.id).emit("student-left", { studentSocketId: socket.id });
        }
      }
      console.log(`[room:leave] ${result.name} from ${result.code}`);
    }
  });
}

module.exports = { registerHandlers };
