import client from "./client";

export async function fetchEvents(monthStart, monthEnd, syncGoogle = false) {
  const { data } = await client.get("/events", {
    params: { monthStart, monthEnd, syncGoogle },
  });
  return data;
}

export async function saveEvent(payload, eventId) {
  const { data } = eventId
    ? await client.put(`/events/${eventId}`, payload)
    : await client.post("/events", payload);
  return data;
}

export async function deleteEvent(eventId, confirmSharedDelete = false) {
  const { data } = await client.delete(`/events/${eventId}`, {
    params: { confirmSharedDelete },
  });
  return data;
}

export async function syncDeviceCalendar(payload) {
  const { data } = await client.post("/events/device-sync", payload);
  return data;
}

export async function updateEventShare(eventId, shared) {
  const { data } = await client.patch(`/events/${eventId}/share`, { shared });
  return data;
}
