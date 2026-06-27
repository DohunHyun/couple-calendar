import client from "./client";

export async function createInviteCode() {
  const { data } = await client.post("/couples/invite-code");
  return data;
}

export async function joinCouple(inviteCode) {
  const { data } = await client.post("/couples/join", { inviteCode });
  return data;
}

export function openCoupleStream(token, onLinked) {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/api$/, "");
  const stream = new EventSource(`${apiBase}/api/couples/stream?token=${encodeURIComponent(token)}`);
  stream.addEventListener("LINKED", (event) => {
    onLinked(JSON.parse(event.data));
  });
  return stream;
}
