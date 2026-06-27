import client from "./client";

export async function getAuthorizeUrl(provider, redirectUri) {
  const { data } = await client.get(`/auth/oauth/${provider}/authorize-url`, {
    params: { redirectUri },
  });
  return data;
}

export async function completeOAuth(provider, payload) {
  const { data } = await client.post(`/auth/oauth/${provider}/callback`, payload);
  return data;
}

export async function fetchMe() {
  const { data } = await client.get("/auth/me");
  return data;
}

export async function updateDeviceToken(deviceToken) {
  await client.put("/auth/device-token", { deviceToken });
}
