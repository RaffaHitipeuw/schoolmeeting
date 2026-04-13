const { generateRoomCode } = require("./utils/generateId");

const rooms = new Map();


function createRoom(teacherSocketId, teacherName) {
  let code;

  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  rooms.set(code, {
    code,
    teacher: { id: teacherSocketId, name: teacherName },
    students: new Map(),
    chat: [],
    handRaised: new Set(),
    createdAt: Date.now(),
  });
  return code;
}

function joinRoom(code, studentSocketId, studentName) {
  const room = rooms.get(code);
  if (!room) return { error: "Room tidak ditemukan. Cek kodenya lagi ya." };
  if (room.students.size >= 50) return { error: "Room sudah penuh (maks 50 siswa)." };
  room.students.set(studentSocketId, studentName);
  return { room };
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function getRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.teacher?.id === socketId) return room;
    if (room.students.has(socketId)) return room;
  }
  return null;
}

function removeParticipant(socketId) {
  for (const [code, room] of rooms) {
    if (room.teacher?.id === socketId) {
      rooms.delete(code);
      return { code, closed: true };
    }
    if (room.students.has(socketId)) {
      const name = room.students.get(socketId);
      room.students.delete(socketId);
      room.handRaised.delete(socketId);
      return { code, closed: false, name };
    }
  }
  return null;
}

function addChat(code, senderName, message) {
  const room = rooms.get(code);
  if (!room) return null;
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    senderName,
    message,
    time: Date.now(),
  };
  room.chat.push(entry);
  if (room.chat.length > 300) room.chat.shift();
  return entry;
}


function getPresence(room) {
  return {
    teacher: room.teacher?.name || null,
    students: Array.from(room.students.values()),
    count: 1 + room.students.size,
  };
}


function setHandRaise(code, socketId, raised) {
  const room = rooms.get(code);
  if (!room) return false;
  if (raised) room.handRaised.add(socketId);
  else room.handRaised.delete(socketId);
  return true;
}

function getHandRaisers(room) {
  return Array.from(room.handRaised).map((sid) => ({
    socketId: sid,
    name: room.students.get(sid) || "?",
  }));
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getRoomBySocketId,
  removeParticipant,
  addChat,
  getPresence,
  setHandRaise,
  getHandRaisers,
};
