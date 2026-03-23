import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ytdl from "@distube/ytdl-core";

type CookieArray = Parameters<typeof ytdl.createAgent>[0];

const RUNTIME_DIR = path.join(process.cwd(), ".runtime");
const RUNTIME_COOKIES_FILE = path.join(RUNTIME_DIR, "youtube-cookies.json");

let runtimeAgent: ReturnType<typeof ytdl.createAgent> | undefined;
let runtimeCookiesLoaded = false;

function parseCookiesJson(raw: string): CookieArray {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Cookies JSON must be an array (EditThisCookie export).");
  }
  return parsed as CookieArray;
}

function loadRuntimeCookiesIfNeeded() {
  if (runtimeCookiesLoaded) return;
  runtimeCookiesLoaded = true;
  if (!existsSync(RUNTIME_COOKIES_FILE)) return;
  try {
    const raw = readFileSync(RUNTIME_COOKIES_FILE, "utf-8");
    const cookies = parseCookiesJson(raw);
    runtimeAgent = ytdl.createAgent(cookies);
  } catch (e) {
    console.error("[youtubeCookies] Failed loading runtime cookie file:", e);
  }
}

function loadEnvCookiesAgent(): ReturnType<typeof ytdl.createAgent> | undefined {
  const file =
    process.env.YOUTUBE_COOKIES_FILE ?? process.env.YOUTUBE_COOKIES_PATH;
  if (!file?.trim()) return undefined;
  try {
    const raw = readFileSync(file.trim(), "utf-8");
    const cookies = parseCookiesJson(raw);
    return ytdl.createAgent(cookies);
  } catch (e) {
    console.error("[youtubeCookies] Env cookie file is invalid/unreadable:", e);
    return undefined;
  }
}

export function getYoutubeCookiesAgent(): ReturnType<typeof ytdl.createAgent> | undefined {
  loadRuntimeCookiesIfNeeded();
  return runtimeAgent ?? loadEnvCookiesAgent();
}

export function setRuntimeYoutubeCookiesFromRaw(raw: string) {
  const cookies = parseCookiesJson(raw);
  runtimeAgent = ytdl.createAgent(cookies);
  mkdirSync(RUNTIME_DIR, { recursive: true });
  writeFileSync(RUNTIME_COOKIES_FILE, raw, "utf-8");
  runtimeCookiesLoaded = true;
  return { cookieCount: Array.isArray(cookies) ? cookies.length : 0 };
}

export function clearRuntimeYoutubeCookies() {
  runtimeAgent = undefined;
  runtimeCookiesLoaded = true;
  rmSync(RUNTIME_COOKIES_FILE, { force: true });
}

export function getYoutubeCookiesStatus() {
  loadRuntimeCookiesIfNeeded();
  const envConfigured = Boolean(
    (process.env.YOUTUBE_COOKIES_FILE ?? process.env.YOUTUBE_COOKIES_PATH)?.trim()
  );
  return {
    runtimeConfigured: Boolean(runtimeAgent),
    envConfigured,
    source: runtimeAgent ? "runtime" : envConfigured ? "env" : "none",
  } as const;
}
