import {
  Box,
  Button,
  createTheme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useEffect, useState, type PropsWithChildren } from "react";
import Dashboard from "./components/Dashboard";
import { ErrorBoundary } from "react-error-boundary";
import ClientEditor from "./components/ClientEditor";
import { ClientProvider } from "./hooks/useClients";
import dayjs from "dayjs";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ef6c00" },
    secondary: { main: "#42a5f5" },
    background: { default: "#303030" },
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

function Splash({ children }: PropsWithChildren) {
  const [hide, setHide] = useState<true | undefined>(() => {
    const now = dayjs();
    const lastVisit = localStorage.getItem("last-visit");
    const lastVisitDate = !!lastVisit && dayjs(lastVisit);
    console.log({ lastVisit, lastVisitDate });
    localStorage.setItem("last-visit", now.toString());
    return (
      (lastVisitDate &&
        lastVisitDate.isValid() &&
        lastVisitDate.isAfter(now.startOf("day"))) ||
      undefined
    );
  });

  useEffect(() => {
    setTimeout(() => setHide(true), 1500);
  }, []);

  console.log({ hide });

  return (
    <Box>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10000,
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center",
          bgcolor: "black",
          gap: 2,
          ...(hide && {
            visibility: "hidden",
            opacity: 0,
            transition: "visibility 1s 0.5s, opacity 1s 0.5s linear",
          }),
        }}
      >
        <Typography variant="h4" color="primary">
          Time?
        </Typography>
        <Typography
          sx={
            hide && {
              visibility: "hidden",
              opacity: 0,
              transition: "visibility 0s 1s, opacity 1s linear",
            }
          }
        >
          Is it really that... <br /> time again?
        </Typography>
      </Box>

      {children}
    </Box>
  );
}

function App() {
  const [editClientsOpen, setEditClientsOpen] = useState<boolean>(false);

  return (
    <ThemeProvider theme={theme}>
      <Splash>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ClientProvider>
            <Box
              sx={{
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Dashboard sx={{ flexGrow: 1, p: 2 }} />
              <ClientEditor
                isOpen={editClientsOpen}
                setIsOpen={setEditClientsOpen}
              />
            </Box>
          </ClientProvider>
        </ErrorBoundary>
      </Splash>
    </ThemeProvider>
  );
}

export default App;
