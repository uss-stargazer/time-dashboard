import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import ClientEditor from './ClientEditor';
import useSettings from '../../hooks/useSettings';
import { currencies } from '../../modules/currencies';

// TODO: rough css NEEDS TO BE STYLED

function Editor() {
  const settings = useSettings();
  if (settings.isLoading) return <Button loading variant='outlined' />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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

export default Editor;
