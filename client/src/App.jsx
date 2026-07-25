import AppRoutes from "./routes/AppRoutes";
import ServerStatusIndicator from "./components/shared/ServerStatusIndicator";

export default function App() {
  return (
    <>
      <AppRoutes />
      <ServerStatusIndicator />
    </>
  );
}
