import { api } from "./api";

export async function getSystemStatus() {
  const { data } = await api.get("/system-status");
  return data;
}
