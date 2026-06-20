import { useState } from 'react';
import { Add, Error as ErrorIcon } from '@mui/icons-material';
import useSettings from '../../hooks/useSettings';
import type { Client } from '../../modules/clients';
import trackers from '../../modules/trackers';
import { Box, Button, Typography } from '@mui/material';
import Card from '../Card';
import ClientForm from './ClientForm';

function ClientEditor() {
  const settings = useSettings();
  const [stagedClient, setStagedClient] = useState<Partial<Client> | null>(
    null,
  );
  const [loadingClient, setLoadingClient] = useState<string | null>(null);
  const [error, setError] = useState<{
    client: string;
    message: string;
  } | null>(null);

  // Functions for editing clients

  const clientNames = settings.clients.map((c) => c.name);
  const addClient = (client: Client, cb?: () => void) => {
    if (clientNames.includes(client.name))
      throw new Error('Add client: client name must be unique');
    const tracker = trackers[client.tracker.name];

    setLoadingClient(client.name);

    (async () => {
      if (tracker.computed)
        client.tracker.computed = await tracker.computed
          // TODO: canceling if component reloads
          .compute(
            client.name,
            // @ts-expect-error TODO: better way. Like I said elsewhere, I'm tired trying to get ts to mesh
            client.tracker.data,
          );
      return client;
    })()
      .catch((error) => {
        setError({
          client: client.name,
          message:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
        throw error;
      })
      .then((client) => {
        settings.setClients([...settings.clients, client]);
        setError(null);
        if (cb) cb();
      })
      .finally(() => setLoadingClient(null));
  };
  const removeClient = (clientName: string) => {
    if (settings.clients.some((c) => c.name === clientName))
      settings.setClients(
        settings.clients.filter((c) => c.name !== clientName),
      );
    if (clientName === error?.client) setError(null);
  };
  const updateClient = (ogName: string, updated: Client, cb?: () => void) => {
    const ogClient = settings.clients.find((c) => c.name == ogName);
    if (!ogClient) throw new Error('Update client: client does not exist');
    if (ogName !== updateClient.name && clientNames.includes(updateClient.name))
      throw new Error('Update client: new client name must be unique');
    const filteredClients = settings.clients.filter((c) => c !== ogClient);

    setLoadingClient(ogName);

    (async () => {
      const tracker = trackers[updated.tracker.name];
      if (tracker.computed)
        updated.tracker.computed = await tracker.computed
          // TODO: canceling if component reloads
          .compute(
            updated.name,
            // @ts-expect-error TODO: better way. Like I said elsewhere, I'm tired trying to get ts to mesh
            updated.tracker.data,
            ogClient.tracker,
          );
      return updated;
    })()
      .catch((error) => {
        setError({
          client: ogName,
          message:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
        throw error;
      })
      .then((client) => {
        settings.setClients([...filteredClients, client]);
        setError(null);
        if (cb) cb();
      })
      .finally(() => setLoadingClient(null));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Card sx={{ maxWidth: undefined, borderColor: 'error.main' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ErrorIcon color='error' fontSize='small' />
            <Typography color='error.main' variant='caption'>
              {`Tracker didn't like client ${error.client} `}
            </Typography>
          </Box>
          <Typography variant='caption' m={1}>
            {error.message}
          </Typography>
        </Card>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {[
          ...settings.clients.map((client) => (
            <ClientForm
              key={client.name}
              client={client}
              invalidNames={clientNames.filter((c) => c !== client.name)}
              submitText='Update'
              onSubmit={(updated) => updateClient(client.name, updated)}
              isHidden={client.isHidden}
              otherButtons={[
                { label: 'Remove', onClick: () => removeClient(client.name) },
                {
                  label: client.isHidden ? 'Unhide' : 'Hide',
                  onClick: () =>
                    updateClient(client.name, {
                      ...client,
                      isHidden: !client.isHidden,
                    }),
                },
              ]}
              buttonStatus={
                loadingClient
                  ? loadingClient === client.name
                    ? 'loading'
                    : 'disabled'
                  : 'normal'
              }
            />
          )),
          stagedClient ? (
            <ClientForm
              key='staged'
              client={stagedClient}
              invalidNames={clientNames}
              submitText='Add'
              onSubmit={(client) =>
                addClient(client, () => setStagedClient(null))
              }
              otherButtons={[
                { label: 'Cancel', onClick: () => setStagedClient(null) },
              ]}
              buttonStatus={
                loadingClient
                  ? loadingClient === stagedClient.name
                    ? 'loading'
                    : 'disabled'
                  : 'normal'
              }
            />
          ) : (
            <Card key='add' fullWidth sx={{ display: 'flex' }}>
              <Button sx={{ flexGrow: 1 }} onClick={() => setStagedClient({})}>
                <Add />
              </Button>
            </Card>
          ),
        ]}
      </Box>
    </Box>
  );
}

export default ClientEditor;
