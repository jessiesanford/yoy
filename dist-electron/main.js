import { ipcMain as w, dialog as U, app as g, BrowserWindow as P, shell as N } from "electron";
import { fileURLToPath as j } from "node:url";
import d from "node:path";
import f from "fs";
import $ from "node:http";
import E from "node:crypto";
const S = d.dirname(j(import.meta.url));
process.env.APP_ROOT = d.join(S, "..");
const T = process.env.VITE_DEV_SERVER_URL, ae = d.join(process.env.APP_ROOT, "dist-electron"), C = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = T ? d.join(process.env.APP_ROOT, "public") : C;
let p;
const b = "https://www.googleapis.com/auth/calendar.readonly", F = "https://accounts.google.com/o/oauth2/v2/auth", V = "https://oauth2.googleapis.com/token", O = "https://www.googleapis.com/calendar/v3", B = "520031747953-922v578d1uivhssjqhatdgf2jaf2m05v.apps.googleusercontent.com", R = [
  "GOOGLE_CALENDAR_CLIENT_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "TRUE_CALENDAR_GOOGLE_CLIENT_SECRET"
];
function G() {
  return d.join(g.getPath("userData"), "google-calendar-state.json");
}
function _() {
  const e = G();
  if (!f.existsSync(e)) return {};
  try {
    return JSON.parse(f.readFileSync(e, "utf-8"));
  } catch {
    return {};
  }
}
function y(e) {
  f.writeFileSync(G(), JSON.stringify(e, null, 2), "utf-8");
}
function W(e) {
  return f.existsSync(e) ? f.readFileSync(e, "utf-8").split(/\r?\n/).reduce((t, n) => {
    const o = n.trim();
    if (!o || o.startsWith("#")) return t;
    const r = o.indexOf("=");
    if (r === -1) return t;
    const a = o.slice(0, r).trim(), i = o.slice(r + 1).trim();
    return t[a] = i.replace(/^['"]|['"]$/g, ""), t;
  }, {}) : {};
}
function q(e) {
  const t = [
    ".env.dev",
    ".env.development",
    ".env.local",
    ".env"
  ].map((n) => d.join(process.env.APP_ROOT, n));
  for (const n of e)
    if (process.env[n]) return process.env[n];
  for (const n of t) {
    const o = W(n);
    for (const r of e)
      if (o[r]) return o[r];
  }
}
function L() {
  return q(R);
}
function k(e) {
  return e.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function M() {
  return k(E.randomBytes(32));
}
function H(e) {
  return k(E.createHash("sha256").update(e).digest());
}
async function J(e) {
  let t;
  const n = new Promise((r, a) => {
    t = $.createServer((i, l) => {
      const s = i.headers.host;
      if (!s || !i.url) return;
      const c = new URL(i.url, `http://${s}`), u = c.searchParams.get("code"), h = c.searchParams.get("state"), m = c.searchParams.get("error");
      if (l.writeHead(m ? 400 : 200, { "Content-Type": "text/html" }), l.end(m ? "<h1>Google Calendar connection failed.</h1><p>You can close this window.</p>" : "<h1>Google Calendar connected.</h1><p>You can close this window and return to True Calendar.</p>"), t == null || t.close(), m) {
        a(new Error(m));
        return;
      }
      if (!u || h !== e) {
        a(new Error("Invalid OAuth response from Google."));
        return;
      }
      r(u);
    }), t.listen(0, "127.0.0.1"), t.on("error", a);
  }), o = await new Promise((r, a) => {
    t == null || t.on("error", a), t == null || t.on("listening", () => {
      const i = t == null ? void 0 : t.address();
      if (!i || typeof i == "string") {
        t == null || t.close(), a(new Error("Unable to start OAuth callback server."));
        return;
      }
      r(`http://127.0.0.1:${i.port}/`);
    });
  });
  return { codePromise: n, redirectUri: o };
}
async function A(e) {
  const t = await fetch(V, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: e
  }), n = await t.text();
  if (!t.ok)
    try {
      const o = JSON.parse(n), r = [o.error, o.error_description].filter(Boolean).join(": ");
      throw new Error(`Google token request failed: ${t.status}${r ? ` - ${r}` : ""}`);
    } catch (o) {
      throw o instanceof SyntaxError ? new Error(`Google token request failed: ${t.status}${n ? ` - ${n}` : ""}`) : o;
    }
  return JSON.parse(n);
}
async function z() {
  const e = _(), t = B, n = L() || e.clientSecret;
  if (!n)
    throw new Error(`Google Calendar OAuth client secret is missing. Add it to .env.dev as ${R[0]}.`);
  const o = M(), r = H(o), a = k(E.randomBytes(16)), { codePromise: i, redirectUri: l } = await J(a), s = new URL(F);
  s.searchParams.set("client_id", t), s.searchParams.set("redirect_uri", l), s.searchParams.set("response_type", "code"), s.searchParams.set("scope", b), s.searchParams.set("access_type", "offline"), s.searchParams.set("prompt", "consent"), s.searchParams.set("code_challenge", r), s.searchParams.set("code_challenge_method", "S256"), s.searchParams.set("state", a), await N.openExternal(s.toString());
  const c = await i, u = new URLSearchParams({
    client_id: t,
    code: c,
    code_verifier: o,
    grant_type: "authorization_code",
    redirect_uri: l
  });
  n && u.set("client_secret", n);
  const h = await A(u);
  return y({
    ...e,
    clientId: t,
    clientSecret: n,
    tokens: {
      accessToken: h.access_token,
      refreshToken: h.refresh_token,
      expiresAt: Date.now() + h.expires_in * 1e3
    },
    syncTokens: {},
    hiddenCalendarIds: []
  }), x();
}
async function Y() {
  const e = _();
  if (!e.clientId || !e.tokens)
    throw new Error("Google Calendar is not connected.");
  const t = L() || e.clientSecret;
  if (e.tokens.expiresAt > Date.now() + 6e4)
    return e.tokens.accessToken;
  if (!e.tokens.refreshToken)
    throw new Error("Google Calendar needs to be reconnected.");
  const n = new URLSearchParams({
    client_id: e.clientId,
    refresh_token: e.tokens.refreshToken,
    grant_type: "refresh_token"
  });
  t && n.set("client_secret", t);
  const o = await A(n), r = {
    ...e,
    tokens: {
      accessToken: o.access_token,
      refreshToken: o.refresh_token || e.tokens.refreshToken,
      expiresAt: Date.now() + o.expires_in * 1e3
    }
  };
  return y(r), r.tokens.accessToken;
}
async function v(e, t) {
  const n = await fetch(t, {
    headers: { Authorization: `Bearer ${e}` }
  });
  if (!n.ok)
    throw new Error(`Google Calendar API request failed: ${n.status}`);
  return await n.json();
}
function K(e) {
  var o, r, a, i, l;
  const t = ((o = e.start) == null ? void 0 : o.dateTime) || ((r = e.start) == null ? void 0 : r.date), n = ((a = e.end) == null ? void 0 : a.dateTime) || ((i = e.end) == null ? void 0 : i.date);
  return !t || !n || e.status === "cancelled" ? null : {
    id: e.id || e.iCalUID || E.randomUUID(),
    title: e.summary || "(No title)",
    description: e.description,
    location: e.location,
    start: t,
    end: n,
    allDay: !!((l = e.start) != null && l.date)
  };
}
async function Q(e, t, n) {
  const o = [], r = [];
  let a, i, l = n;
  do {
    const s = new URL(`${O}/calendars/${encodeURIComponent(t)}/events`);
    s.searchParams.set("maxResults", "2500"), s.searchParams.set("showDeleted", "true"), s.searchParams.set("singleEvents", "true"), a && s.searchParams.set("pageToken", a), l && s.searchParams.set("syncToken", l);
    try {
      const c = await v(e, s);
      for (const u of c.items ?? []) {
        if (u.status === "cancelled" && u.id) {
          r.push(u.id);
          continue;
        }
        const h = K(u);
        h && o.push(h);
      }
      a = c.nextPageToken, i = c.nextSyncToken;
    } catch (c) {
      if (l && c instanceof Error && c.message.includes("410")) {
        l = void 0, a = void 0, o.length = 0;
        continue;
      }
      throw c;
    }
  } while (a);
  return { events: o, deletedEventIds: r, nextSyncToken: i };
}
async function x() {
  const e = await Y(), t = _(), n = new URL(`${O}/users/me/calendarList`), o = await v(e, n), r = new Map((t.calendars ?? []).map((s) => [s.id, s])), a = { ...t.syncTokens ?? {} }, i = new Set(t.hiddenCalendarIds ?? []), l = [];
  for (const s of o.items ?? []) {
    if (!s.id || s.deleted || i.has(s.id)) continue;
    const c = r.get(s.id), { events: u, deletedEventIds: h, nextSyncToken: m } = await Q(e, s.id, a[s.id]), D = a[s.id] && c ? X(c.events, u, h) : u;
    m && (a[s.id] = m), l.push({
      id: s.id,
      name: s.summary || s.id,
      color: s.backgroundColor || (c == null ? void 0 : c.color) || "#2563eb",
      textColor: s.foregroundColor || (c == null ? void 0 : c.textColor),
      events: D
    });
  }
  return y({
    ...t,
    syncTokens: a,
    calendars: l
  }), l;
}
function X(e, t, n) {
  const o = new Map(e.map((r) => [r.id, r]));
  for (const r of n)
    o.delete(r);
  for (const r of t)
    o.set(r.id, r);
  return Array.from(o.values());
}
function Z(e) {
  const t = _(), n = Array.from(/* @__PURE__ */ new Set([...t.hiddenCalendarIds ?? [], e])), o = (t.calendars ?? []).filter((a) => a.id !== e), r = { ...t.syncTokens ?? {} };
  return delete r[e], y({
    ...t,
    hiddenCalendarIds: n,
    syncTokens: r,
    calendars: o
  }), o;
}
function I() {
  p = new P({
    title: "True Calendar",
    icon: d.join(process.env.APP_ROOT, "build", "icon.png"),
    webPreferences: {
      preload: d.join(S, "preload.mjs")
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
  }), p.webContents.on("did-finish-load", () => {
    p == null || p.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), T ? p.loadURL(T) : p.loadFile(d.join(C, "index.html"));
}
w.handle("import-calendar", async () => {
  const { canceled: e, filePaths: t } = await U.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Calendar Files", extensions: ["ics"] }]
  });
  if (e || t.length === 0) return null;
  const n = t[0], o = d.join(g.getPath("userData"), "Calendars");
  f.existsSync(o) || f.mkdirSync(o, { recursive: !0 });
  const r = d.join(o, "calendar.ics");
  return f.copyFileSync(n, r), r;
});
w.handle("read-file", (e, t) => f.readFileSync(t, "utf-8"));
w.handle("get-calendars", () => {
  const e = d.join(g.getPath("userData"), "Calendars");
  return f.existsSync(e) ? f.readdirSync(e).filter((n) => n.endsWith(".ics")).map((n) => f.readFileSync(d.join(e, n), "utf-8")) : [];
});
w.handle("get-google-calendars", () => _().calendars ?? []);
w.handle("connect-google-calendar", () => z());
w.handle("sync-google-calendar", () => x());
w.handle("remove-google-calendar", (e, t) => Z(t));
g.on("window-all-closed", () => {
  process.platform !== "darwin" && (g.quit(), p = null);
});
g.on("activate", () => {
  P.getAllWindows().length === 0 && I();
});
g.whenReady().then(I);
export {
  ae as MAIN_DIST,
  C as RENDERER_DIST,
  T as VITE_DEV_SERVER_URL
};
