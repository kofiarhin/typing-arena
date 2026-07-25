import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ServerStatusIndicator from "../src/components/shared/ServerStatusIndicator";
import { getSystemStatus } from "../src/services/systemStatusApi";

vi.mock("../src/services/systemStatusApi", () => ({
  getSystemStatus: vi.fn(),
}));

function renderIndicator() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ServerStatusIndicator />
    </QueryClientProvider>
  );
}

describe("ServerStatusIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading state", () => {
    getSystemStatus.mockReturnValue(new Promise(() => {}));
    renderIndicator();
    expect(screen.getByText("Checking server…")).toBeInTheDocument();
  });

  it("shows the online state", async () => {
    getSystemStatus.mockResolvedValue({ status: "ok" });
    renderIndicator();
    expect(await screen.findByText("Server online")).toBeInTheDocument();
  });

  it("shows the unavailable state", async () => {
    getSystemStatus.mockRejectedValue(new Error("offline"));
    renderIndicator();
    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
  });
});
