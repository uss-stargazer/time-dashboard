import ClientEditor from './ClientEditor';
import useSettings from '../../hooks/useSettings';
import { currencies } from '../../modules/currencies';
import {
  AppBar,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  GlobalStyles,
  styled,
  SwipeableDrawer,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState, type PropsWithChildren, type Ref } from 'react';

function Editor() {
  const settings = useSettings();
  if (settings.isLoading) return <Button loading variant='outlined' />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'left ' }}>
        <FormControl>
          <InputLabel>Currency</InputLabel>
          <Select
            value={settings.money.currency}
            onChange={(event) => settings.setCurrency(event.target.value)}
            sx={{ minWidth: 100 }}
          >
            {currencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ClientEditor />
    </Box>
  );
}

const drawerBleeding = 25;
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
