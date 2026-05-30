import { ipcMain, dialog, app, BrowserWindow, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import http from "node:http";
import crypto from "node:crypto";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_URL = "https://www.googleapis.com/calendar/v3";
function getGoogleStatePath() {
  return path.join(app.getPath("userData"), "google-calendar-state.json");
}
function readGoogleState() {
  const statePath = getGoogleStatePath();
  if (!fs.existsSync(statePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf-8"));
  } catch {
    return {};
  }
}
function writeGoogleState(state) {
  fs.writeFileSync(getGoogleStatePath(), JSON.stringify(state, null, 2), "utf-8");
}
function base64Url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function createCodeVerifier() {
  return base64Url(crypto.randomBytes(32));
}
function createCodeChallenge(verifier) {
  return base64Url(crypto.createHash("sha256").update(verifier).digest());
}
async function createOAuthCallback(expectedState) {
  let server;
  const codePromise = new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const host = req.headers.host;
      if (!host || !req.url) return;
      const url = new URL(req.url, `http://${host}`);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      res.writeHead(error ? 400 : 200, { "Content-Type": "text/html" });
      res.end(error ? "<h1>Google Calendar connection failed.</h1><p>You can close this window.</p>" : "<h1>Google Calendar connected.</h1><p>You can close this window and return to True Calendar.</p>");
      server == null ? void 0 : server.close();
      if (error) {
        reject(new Error(error));
        return;
      }
      if (!code || state !== expectedState) {
        reject(new Error("Invalid OAuth response from Google."));
        return;
      }
      resolve(code);
    });
    server.listen(0, "127.0.0.1");
    server.on("error", reject);
  });
  const redirectUri = await new Promise((resolve, reject) => {
    server == null ? void 0 : server.on("error", reject);
    server == null ? void 0 : server.on("listening", () => {
      const address = server == null ? void 0 : server.address();
      if (!address || typeof address === "string") {
        server == null ? void 0 : server.close();
        reject(new Error("Unable to start OAuth callback server."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });
  return { codePromise, redirectUri };
}
async function requestGoogleToken(params) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const responseText = await response.text();
  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText);
      const errorMessage = [errorData.error, errorData.error_description].filter(Boolean).join(": ");
      throw new Error(`Google token request failed: ${response.status}${errorMessage ? ` - ${errorMessage}` : ""}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Google token request failed: ${response.status}${responseText ? ` - ${responseText}` : ""}`);
      }
      throw error;
    }
  }
  return JSON.parse(responseText);
}
async function connectGoogleCalendar(clientId, clientSecret) {
  const state = readGoogleState();
  const configuredClientId = (clientId == null ? void 0 : clientId.trim()) || state.clientId;
  const configuredClientSecret = (clientSecret == null ? void 0 : clientSecret.trim()) || state.clientSecret;
  if (!configuredClientId) {
    throw new Error("Google Calendar OAuth client ID is required.");
  }
  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const requestState = base64Url(crypto.randomBytes(16));
  const { codePromise, redirectUri } = await createOAuthCallback(requestState);
  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", configuredClientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_CALENDAR_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", requestState);
  await shell.openExternal(authUrl.toString());
  const code = await codePromise;
  const tokenParams = new URLSearchParams({
    client_id: configuredClientId,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri
  });
  if (configuredClientSecret) {
    tokenParams.set("client_secret", configuredClientSecret);
  }
  const tokenResponse = await requestGoogleToken(tokenParams);
  writeGoogleState({
    ...state,
    clientId: configuredClientId,
    clientSecret: configuredClientSecret,
    tokens: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1e3
    },
    syncTokens: {},
    hiddenCalendarIds: []
  });
  return syncGoogleCalendars();
}
async function getValidGoogleAccessToken() {
  const state = readGoogleState();
  if (!state.clientId || !state.tokens) {
    throw new Error("Google Calendar is not connected.");
  }
  if (state.tokens.expiresAt > Date.now() + 6e4) {
    return state.tokens.accessToken;
  }
  if (!state.tokens.refreshToken) {
    throw new Error("Google Calendar needs to be reconnected.");
  }
  const tokenParams = new URLSearchParams({
    client_id: state.clientId,
    refresh_token: state.tokens.refreshToken,
    grant_type: "refresh_token"
  });
  if (state.clientSecret) {
    tokenParams.set("client_secret", state.clientSecret);
  }
  const tokenResponse = await requestGoogleToken(tokenParams);
  const nextState = {
    ...state,
    tokens: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || state.tokens.refreshToken,
      expiresAt: Date.now() + tokenResponse.expires_in * 1e3
    }
  };
  writeGoogleState(nextState);
  return nextState.tokens.accessToken;
}
async function googleApiGet(accessToken, url) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Google Calendar API request failed: ${response.status}`);
  }
  return await response.json();
}
function normalizeGoogleEvent(event) {
  var _a, _b, _c, _d, _e;
  const start = ((_a = event.start) == null ? void 0 : _a.dateTime) || ((_b = event.start) == null ? void 0 : _b.date);
  const end = ((_c = event.end) == null ? void 0 : _c.dateTime) || ((_d = event.end) == null ? void 0 : _d.date);
  if (!start || !end || event.status === "cancelled") return null;
  return {
    id: event.id || event.iCalUID || crypto.randomUUID(),
    title: event.summary || "(No title)",
    description: event.description,
    location: event.location,
    start,
    end,
    allDay: Boolean((_e = event.start) == null ? void 0 : _e.date)
  };
}
async function fetchCalendarEvents(accessToken, calendarId, syncToken) {
  const events = [];
  const deletedEventIds = [];
  let nextPageToken;
  let nextSyncToken;
  let useSyncToken = syncToken;
  do {
    const url = new URL(`${GOOGLE_CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("showDeleted", "true");
    url.searchParams.set("singleEvents", "true");
    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    }
    if (useSyncToken) {
      url.searchParams.set("syncToken", useSyncToken);
    }
    try {
      const data = await googleApiGet(accessToken, url);
      for (const item of data.items ?? []) {
        if (item.status === "cancelled" && item.id) {
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
      if (useSyncToken && error instanceof Error && error.message.includes("410")) {
        useSyncToken = void 0;
        nextPageToken = void 0;
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
  const calendarList = await googleApiGet(accessToken, calendarListUrl);
  const existingCalendars = new Map((state.calendars ?? []).map((calendar) => [calendar.id, calendar]));
  const nextSyncTokens = { ...state.syncTokens ?? {} };
  const hiddenCalendarIds = new Set(state.hiddenCalendarIds ?? []);
  const calendars = [];
  for (const item of calendarList.items ?? []) {
    if (!item.id || item.deleted) continue;
    if (hiddenCalendarIds.has(item.id)) continue;
    const previousCalendar = existingCalendars.get(item.id);
    const { events, deletedEventIds, nextSyncToken } = await fetchCalendarEvents(accessToken, item.id, nextSyncTokens[item.id]);
    const nextEvents = nextSyncTokens[item.id] && previousCalendar ? mergeGoogleEvents(previousCalendar.events, events, deletedEventIds) : events;
    if (nextSyncToken) {
      nextSyncTokens[item.id] = nextSyncToken;
    }
    calendars.push({
      id: item.id,
      name: item.summary || item.id,
      color: item.backgroundColor || (previousCalendar == null ? void 0 : previousCalendar.color) || "#2563eb",
      events: nextEvents
    });
  }
  writeGoogleState({
    ...state,
    syncTokens: nextSyncTokens,
    calendars
  });
  return calendars;
}
function mergeGoogleEvents(previousEvents, changedEvents, deletedEventIds) {
  const eventsById = new Map(previousEvents.map((event) => [event.id, event]));
  for (const eventId of deletedEventIds) {
    eventsById.delete(eventId);
  }
  for (const event of changedEvents) {
    eventsById.set(event.id, event);
  }
  return Array.from(eventsById.values());
}
function removeGoogleCalendar(calendarId) {
  const state = readGoogleState();
  const hiddenCalendarIds = Array.from(/* @__PURE__ */ new Set([...state.hiddenCalendarIds ?? [], calendarId]));
  const calendars = (state.calendars ?? []).filter((calendar) => calendar.id !== calendarId);
  const syncTokens = { ...state.syncTokens ?? {} };
  delete syncTokens[calendarId];
  writeGoogleState({
    ...state,
    hiddenCalendarIds,
    syncTokens,
    calendars
  });
  return calendars;
}
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    },
    width: 1200,
    // default width
    height: 800,
    // default height
    minWidth: 900,
    // optional
    minHeight: 700
    // optional
    // autoHideMenuBar: true
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("import-calendar", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Calendar Files", extensions: ["ics"] }]
  });
  if (canceled || filePaths.length === 0) return null;
  const filePath = filePaths[0];
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) {
    fs.mkdirSync(calendarsDir, { recursive: true });
  }
  const destPath = path.join(calendarsDir, "calendar.ics");
  fs.copyFileSync(filePath, destPath);
  return destPath;
});
ipcMain.handle("read-file", (_e, filePath) => fs.readFileSync(filePath, "utf-8"));
ipcMain.handle("get-calendars", () => {
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) return [];
  const files = fs.readdirSync(calendarsDir).filter((f) => f.endsWith(".ics"));
  return files.map((f) => fs.readFileSync(path.join(calendarsDir, f), "utf-8"));
});
ipcMain.handle("get-google-calendars", () => readGoogleState().calendars ?? []);
ipcMain.handle("connect-google-calendar", (_event, clientId, clientSecret) => connectGoogleCalendar(clientId, clientSecret));
ipcMain.handle("sync-google-calendar", () => syncGoogleCalendars());
ipcMain.handle("remove-google-calendar", (_event, calendarId) => removeGoogleCalendar(calendarId));
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
