import { useQuery } from "@tanstack/react-query";
import { getSystemStatus } from "../../services/systemStatusApi";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-status"],
    queryFn: getSystemStatus,
    retry: false,
    refetchInterval: 30000,
  });
}
