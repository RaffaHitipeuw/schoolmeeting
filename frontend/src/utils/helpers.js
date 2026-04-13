
export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


export function truncate(str, maxLen = 30) {
  return str?.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
