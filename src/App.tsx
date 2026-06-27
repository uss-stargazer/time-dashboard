import {
  Box,
  Button,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useEffect, useState, type PropsWithChildren } from 'react';
import Dashboard from './components/Dashboard';
import { ErrorBoundary } from 'react-error-boundary';
import { SettingsProvider } from './hooks/useSettings';
import SettingsEditor from './components/SettingEditor';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ef6c00' },
    secondary: { main: '#42a5f5' },
    background: { default: '#303030' },
  },
  typography: { fontFamily: "'Fira Mono', monospace" },
});

function ErrorFallback({ error }: { error: unknown }) {
  const [showError, setShowError] = useState<boolean>(false);
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant='h4' color='warning'>
        :[
      </Typography>
      <Typography align='center' maxWidth='50%'>
        The right code in the wrong place can make all the difference in the
        world...
      </Typography>

      <Button
        size='small'
        color='error'
        onClick={() => setShowError(!showError)}
      >
        {showError ? 'Hide' : 'Show'} error
      </Button>
      {showError && (
        <Typography variant='caption' align='center' maxWidth='75%'>
          {error instanceof Error
            ? error.message
            : JSON.stringify(error, undefined, '  ')}
        </Typography>
      )}
    </Box>
  );
}

function Splash({ children }: PropsWithChildren) {
  const [hide, setHide] = useState<true | undefined>(undefined);
  useEffect(() => {
    setTimeout(() => setHide(true), 1500);
  }, []);

  return (
    <Box>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10000,
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
          bgcolor: 'black',
          gap: 2,
          ...(hide && {
            visibility: 'hidden',
            opacity: 0,
            transition: 'visibility 1s 0.5s, opacity 1s 0.5s linear',
          }),
        }}
      >
        <Typography variant='h4' color='primary'>
          Time?
        </Typography>
        <Typography
          sx={
            hide && {
              visibility: 'hidden',
              opacity: 0,
              transition: 'visibility 0s 1s, opacity 1s linear',
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Splash>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <SettingsProvider>
            <Box
              sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Dashboard sx={{ flexGrow: 1, p: 2, pt: 3 }} />
              <SettingsEditor />
            </Box>
          </SettingsProvider>
        </ErrorBoundary>
      </Splash>
    </ThemeProvider>
  );
}

export default App;
