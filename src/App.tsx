import {
  Box,
  Button,
  createTheme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { ClientProvider } from "./hooks/useClients";
import Dashboard from "./components/Dashboard";
import { ErrorBoundary } from "react-error-boundary";
import ClientEditor from "./components/ClientEditor";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ef6c00",
    },
    secondary: {
      main: "#42a5f5",
    },
  },
  typography: { fontFamily: "'Fira Mono', monospace" },
});

function ErrorFallback({ error }: { error: unknown }) {
  const [showError, setShowError] = useState<boolean>(false);
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Typography variant="h4" color="warning">
        :[
      </Typography>
      <Typography align="center" maxWidth="50%">
        The right code in the wrong place can make all the difference in the
        world...
      </Typography>

      <Button
        size="small"
        color="error"
        onClick={() => setShowError(!showError)}
      >
        {showError ? "Hide" : "Show"} error
      </Button>
      {showError && (
        <Typography variant="caption" align="center" maxWidth="75%">
          {error instanceof Error
            ? error.message
            : JSON.stringify(error, undefined, "  ")}
        </Typography>
      )}
    </Box>
  );
}

function App() {
  const editClientsRef = useRef<HTMLDivElement | null>(null);
  const editClientsContainerRef = useRef<HTMLElement | null>(null);
  const [editClientsOpen, setEditClientsOpen] = useState<boolean>(false);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <ClientProvider>
            <Box
              sx={{
                flexGrow: 1,
                p: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
              ref={editClientsContainerRef}
            >
              <Dashboard />
              <ClientEditor
                isOpen={editClientsOpen}
                setIsOpen={setEditClientsOpen}
                ref={editClientsRef}
                container={() => editClientsContainerRef.current}
              />
            </Box>
          </ClientProvider>
        </Box>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
