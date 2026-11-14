import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";
import "./styles/tailwind.css";
import "./styles/ux-fixes.css";
import { initAnalytics } from "./lib/analytics";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    storageKey="tiempos-theme"
    disableTransitionOnChange
  >
    <LanguageProvider>
      <AuthProvider>
        <ErrorBoundary>
          <div className="flex h-full min-h-0 w-full flex-1 flex-col">
            <App />
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>,
);
  