import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'fs';
import http from 'node:http';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
}

interface GoogleCalendar {
  id: string;
  name: string;
  color: string;
  events: GoogleCalendarEvent[];
}

interface GoogleTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface GoogleCalendarState {
  clientId?: string;
  clientSecret?: string;
  tokens?: GoogleTokenData;
  syncTokens?: Record<string, string>;
  calendars?: GoogleCalendar[];
  hiddenCalendarIds?: string[];
}

interface GoogleCalendarListItem {
  id: string;
  summary?: string;
  backgroundColor?: string;
  deleted?: boolean;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
}

interface GoogleEventDate {
  date?: string;
  dateTime?: string;
}

interface GoogleEventItem {
  id?: string;
  iCalUID?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
}

interface GoogleEventsResponse {
  items?: GoogleEventItem[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

function getGoogleStatePath() {
  return path.join(app.getPath('userData'), 'google-calendar-state.json');
}

function readGoogleState(): GoogleCalendarState {
  const statePath = getGoogleStatePath();
  if (!fs.existsSync(statePath)) return {};

  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as GoogleCalendarState;
  } catch {
    return {};
  }
}

function writeGoogleState(state: GoogleCalendarState) {
  fs.writeFileSync(getGoogleStatePath(), JSON.stringify(state, null, 2), 'utf-8');
}

function base64Url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createCodeVerifier() {
  return base64Url(crypto.randomBytes(32));
}

function createCodeChallenge(verifier: string) {
  return base64Url(crypto.createHash('sha256').update(verifier).digest());
}

async function createOAuthCallback(expectedState: string) {
  let server: http.Server | undefined;
  const codePromise = new Promise<string>((resolve, reject) => {
    server = http.createServer((req, res) => {
      const host = req.headers.host;
      if (!host || !req.url) return;

      const url = new URL(req.url, `http://${host}`);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      res.writeHead(error ? 400 : 200, { 'Content-Type': 'text/html' });
      res.end(error
        ? '<h1>Google Calendar connection failed.</h1><p>You can close this window.</p>'
        : '<h1>Google Calendar connected.</h1><p>You can close this window and return to True Calendar.</p>');

      server?.close();

      if (error) {
        reject(new Error(error));
        return;
      }

      if (!code || state !== expectedState) {
        reject(new Error('Invalid OAuth response from Google.'));
        return;
      }

      resolve(code);
    });

    server.listen(0, '127.0.0.1');
    server.on('error', reject);
  });

  const redirectUri = await new Promise<string>((resolve, reject) => {
    server?.on('error', reject);
    server?.on('listening', () => {
      const address = server?.address();
      if (!address || typeof address === 'string') {
        server?.close();
        reject(new Error('Unable to start OAuth callback server.'));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });

  return { codePromise, redirectUri };
}

async function requestGoogleToken(params: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const responseText = await response.text();
  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText) as {
        error?: string;
        error_description?: string;
      };
      const errorMessage = [errorData.error, errorData.error_description].filter(Boolean).join(': ');
      throw new Error(`Google token request failed: ${response.status}${errorMessage ? ` - ${errorMessage}` : ''}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Google token request failed: ${response.status}${responseText ? ` - ${responseText}` : ''}`);
      }

      throw error;
    }
  }

  return JSON.parse(responseText) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

async function connectGoogleCalendar(clientId?: string, clientSecret?: string) {
  const state = readGoogleState();
  const configuredClientId = clientId?.trim() || state.clientId;
  const configuredClientSecret = clientSecret?.trim() || state.clientSecret;
  if (!configuredClientId) {
    throw new Error('Google Calendar OAuth client ID is required.');
  }

  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const requestState = base64Url(crypto.randomBytes(16));
  const { codePromise, redirectUri } = await createOAuthCallback(requestState);
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set('client_id', configuredClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_CALENDAR_SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', requestState);

  await shell.openExternal(authUrl.toString());

  const code = await codePromise;
  const tokenParams = new URLSearchParams({
    client_id: configuredClientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  if (configuredClientSecret) {
    tokenParams.set('client_secret', configuredClientSecret);
  }

  const tokenResponse = await requestGoogleToken(tokenParams);

  writeGoogleState({
    ...state,
    clientId: configuredClientId,
    clientSecret: configuredClientSecret,
    tokens: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    },
    syncTokens: {},
    hiddenCalendarIds: [],
  });

  return syncGoogleCalendars();
}

async function getValidGoogleAccessToken() {
  const state = readGoogleState();
  if (!state.clientId || !state.tokens) {
    throw new Error('Google Calendar is not connected.');
  }

  if (state.tokens.expiresAt > Date.now() + 60_000) {
    return state.tokens.accessToken;
  }

  if (!state.tokens.refreshToken) {
    throw new Error('Google Calendar needs to be reconnected.');
  }

  const tokenParams = new URLSearchParams({
    client_id: state.clientId,
    refresh_token: state.tokens.refreshToken,
    grant_type: 'refresh_token',
  });

  if (state.clientSecret) {
    tokenParams.set('client_secret', state.clientSecret);
  }

  const tokenResponse = await requestGoogleToken(tokenParams);

  const nextState = {
    ...state,
    tokens: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || state.tokens.refreshToken,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    },
  };

  writeGoogleState(nextState);

  return nextState.tokens.accessToken;
}

async function googleApiGet<T>(accessToken: string, url: URL) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google Calendar API request failed: ${response.status}`);
  }

  return await response.json() as T;
}

function normalizeGoogleEvent(event: GoogleEventItem): GoogleCalendarEvent | null {
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;
  if (!start || !end || event.status === 'cancelled') return null;

  return {
    id: event.id || event.iCalUID || crypto.randomUUID(),
    title: event.summary || '(No title)',
    description: event.description,
    location: event.location,
    start,
    end,
    allDay: Boolean(event.start?.date),
  };
}

async function fetchCalendarEvents(accessToken: string, calendarId: string, syncToken?: string) {
  const events: GoogleCalendarEvent[] = [];
  const deletedEventIds: string[] = [];
  let nextPageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let useSyncToken = syncToken;

  do {
    const url = new URL(`${GOOGLE_CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('maxResults', '2500');
    url.searchParams.set('showDeleted', 'true');
    url.searchParams.set('singleEvents', 'true');

    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken);
    }

    if (useSyncToken) {
      url.searchParams.set('syncToken', useSyncToken);
    }

    try {
      const data = await googleApiGet<GoogleEventsResponse>(accessToken, url);
      for (const item of data.items ?? []) {
        if (item.status === 'cancelled' && item.id) {
          deletedEventIds.push(item.id);
          continue;
        }

        const event = normalizeGoogleEvent(item);
        if (event) {
          events.push(event);
        }
      }
      nextPageToken = data.nextPageToken;
      nextSyncToken = data.nextSyncToken;
    } catch (error) {
      if (useSyncToken && error instanceof Error && error.message.includes('410')) {
        useSyncToken = undefined;
        nextPageToken = undefined;
        events.length = 0;
        continue;
      }

      throw error;
    }
  } while (nextPageToken);

  return { events, deletedEventIds, nextSyncToken };
}

async function syncGoogleCalendars() {
  const accessToken = await getValidGoogleAccessToken();
  const state = readGoogleState();
  const calendarListUrl = new URL(`${GOOGLE_CALENDAR_API_URL}/users/me/calendarList`);
  const calendarList = await googleApiGet<GoogleCalendarListResponse>(accessToken, calendarListUrl);
  const existingCalendars = new Map((state.calendars ?? []).map((calendar) => [calendar.id, calendar]));
  const nextSyncTokens = { ...(state.syncTokens ?? {}) };
  const hiddenCalendarIds = new Set(state.hiddenCalendarIds ?? []);
  const calendars: GoogleCalendar[] = [];

  for (const item of calendarList.items ?? []) {
    if (!item.id || item.deleted) continue;
    if (hiddenCalendarIds.has(item.id)) continue;

    const previousCalendar = existingCalendars.get(item.id);
    const { events, deletedEventIds, nextSyncToken } = await fetchCalendarEvents(accessToken, item.id, nextSyncTokens[item.id]);
    const nextEvents = nextSyncTokens[item.id] && previousCalendar
      ? mergeGoogleEvents(previousCalendar.events, events, deletedEventIds)
      : events;

    if (nextSyncToken) {
      nextSyncTokens[item.id] = nextSyncToken;
    }

    calendars.push({
      id: item.id,
      name: item.summary || item.id,
      color: item.backgroundColor || previousCalendar?.color || '#2563eb',
      events: nextEvents,
    });
  }

  writeGoogleState({
    ...state,
    syncTokens: nextSyncTokens,
    calendars,
  });

  return calendars;
}

function mergeGoogleEvents(previousEvents: GoogleCalendarEvent[], changedEvents: GoogleCalendarEvent[], deletedEventIds: string[]) {
  const eventsById = new Map(previousEvents.map((event) => [event.id, event]));
  for (const eventId of deletedEventIds) {
    eventsById.delete(eventId);
  }

  for (const event of changedEvents) {
    eventsById.set(event.id, event);
  }

  return Array.from(eventsById.values());
}

function removeGoogleCalendar(calendarId: string) {
  const state = readGoogleState();
  const hiddenCalendarIds = Array.from(new Set([...(state.hiddenCalendarIds ?? []), calendarId]));
  const calendars = (state.calendars ?? []).filter((calendar) => calendar.id !== calendarId);
  const syncTokens = { ...(state.syncTokens ?? {}) };
  delete syncTokens[calendarId];

  writeGoogleState({
    ...state,
    hiddenCalendarIds,
    syncTokens,
    calendars,
  });

  return calendars;
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    width: 1200,   // default width
    height: 800,   // default height
    minWidth: 900, // optional
    minHeight: 700, // optional
    // autoHideMenuBar: true
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

ipcMain.handle('import-calendar', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Calendar Files", extensions: ["ics"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];

  // Ensure Calendars subdirectory exists
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) {
    fs.mkdirSync(calendarsDir, { recursive: true });
  }

  // Save the file in Calendars directory
  const destPath = path.join(calendarsDir, "calendar.ics");
  fs.copyFileSync(filePath, destPath);

  return destPath;
})

ipcMain.handle("read-file", (_e, filePath: string) => fs.readFileSync(filePath, "utf-8"));

ipcMain.handle("get-calendars", () => {
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) return [];
  const files = fs.readdirSync(calendarsDir).filter((f) => f.endsWith(".ics"));
  return files.map((f) => fs.readFileSync(path.join(calendarsDir, f), "utf-8"));
});

ipcMain.handle("get-google-calendars", () => readGoogleState().calendars ?? []);
ipcMain.handle("connect-google-calendar", (_event, clientId?: string, clientSecret?: string) => connectGoogleCalendar(clientId, clientSecret));
ipcMain.handle("sync-google-calendar", () => syncGoogleCalendars());
ipcMain.handle("remove-google-calendar", (_event, calendarId: string) => removeGoogleCalendar(calendarId));

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
