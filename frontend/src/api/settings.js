import client from "./client";

export async function fetchSettings() {
  const { data } = await client.get("/settings");
  return data;
}

export async function updatePreferences(payload) {
  const { data } = await client.patch("/settings/preferences", payload);
  return data;
}

export async function updateProfile(payload) {
  const { data } = await client.patch("/settings/profile", payload);
  return data;
}
