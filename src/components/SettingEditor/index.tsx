import { Settings } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  GlobalStyles,
  styled,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState, type PropsWithChildren, type Ref } from 'react';
import useSettings from '../../hooks/useSettings';
import ClientEditor from './ClientEditor';

function Editor() {
  const settings = useSettings();

  if (settings.isLoading) return <Button loading variant='outlined' />;

  // TODO: rough css
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <ClientEditor />
    </Box>
  );
}

const drawerBleeding = 60;
const Puller = styled('div')(() => ({
  width: 30,
  height: 6,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
  backgroundColor: grey[500],
  borderRadius: 3,
  cursor: 'pointer',
}));

function PullableContent({
  isOpen,
  setIsOpen,
  ref,
  children,
}: PropsWithChildren<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  ref?: Ref<HTMLDivElement>;
}>) {
  return (
    <>
      <GlobalStyles
        styles={{
          '.MuiDrawer-root > .MuiPaper-root': {
            height: `calc(70% - ${drawerBleeding}px)`,
            overflow: 'visible',
          },
        }}
      />
      <Box onClick={() => isOpen || setIsOpen(true)}>
        <SwipeableDrawer
          anchor='bottom'
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
          swipeAreaWidth={drawerBleeding}
          disableSwipeToOpen={false}
          keepMounted
        >
          <AppBar
            sx={{
              position: 'absolute',
              top: -drawerBleeding,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              visibility: 'visible',
              right: 0,
              left: 0,
              height: `${drawerBleeding}px`,
              bgcolor: 'primary.dark',
            }}
          >
            <Puller />
          </AppBar>
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }} ref={ref}>
            {children}
          </Box>
        </SwipeableDrawer>

        {/* Empty box to make sure no elements can hide behind the drawer bar */}
        <Box sx={{ height: `${drawerBleeding}px` }} />
      </Box>
    </>
  );
}

function SettingsEditor() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <PullableContent isOpen={isOpen} setIsOpen={setIsOpen}>
      <Editor />
    </PullableContent>
  );
}

export default SettingsEditor;
