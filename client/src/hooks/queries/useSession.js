import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export function useSession(gameId) {
  return useQuery({
    queryKey: ["session", gameId],
    queryFn: async () => {
      const { data } = await api.get(`/sessions/${gameId}`);
      return data;
    },
    enabled: !!gameId,
    retry: false,
  });
}
