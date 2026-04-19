import { ErrorBoundary } from "./components/error-boundary";
import { SinTrackerContent } from "./components/sin-tracker-content";

export default function App() {
  return (
    <ErrorBoundary>
      <SinTrackerContent />
    </ErrorBoundary>
  );
}
