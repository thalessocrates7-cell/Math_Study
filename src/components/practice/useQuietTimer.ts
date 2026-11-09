"use client";

import { useCallback, useEffect, useRef } from "react";

const SAVE_EVERY_MS = 120_000;
const TICK_MS = 15_000;
/** A longer gap between ticks means the device slept or the tab froze: count only this much of it. */
const MAX_STRETCH_MS = 60_000;

function send(attemptId: string, seconds: number) {
  const body = JSON.stringify({ a: attemptId, s: seconds });
  try {
    if (navigator.sendBeacon?.("/api/time", new Blob([body], { type: "text/plain" }))) return;
  } catch {
    // fall back to fetch below
  }
  fetch("/api/time", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => undefined);
}

/**
 * The quiet timer: counts only while the problem is on screen and `running` (not paused, not rated),
 * never shows a clock, and saves every couple of minutes and whenever the page is hidden or left.
 * The last unsaved seconds go with the rating (stopAndTake).
 */
export function useQuietTimer(attemptId: string | null, running: boolean) {
  const acc = useRef(0);
  const since = useRef<number | null>(null);
  const idRef = useRef<string | null>(null);
  const runningRef = useRef(running);

  const fold = useCallback(() => {
    if (since.current === null) return;
    const now = performance.now();
    acc.current += Math.min(MAX_STRETCH_MS, Math.max(0, now - since.current));
    since.current = now;
  }, []);

  const take = useCallback((): number => {
    fold();
    const s = Math.floor(acc.current / 1000);
    acc.current -= s * 1000;
    return s;
  }, [fold]);

  const flush = useCallback(() => {
    const id = idRef.current;
    if (!id) return;
    const s = take();
    if (s > 0) send(id, s);
  }, [take]);

  const sync = useCallback(() => {
    const on = runningRef.current && idRef.current !== null && document.visibilityState === "visible";
    if (on && since.current === null) since.current = performance.now();
    if (!on && since.current !== null) {
      fold();
      since.current = null;
    }
  }, [fold]);

  useEffect(() => {
    idRef.current = attemptId;
    sync();
  }, [attemptId, sync]);

  useEffect(() => {
    runningRef.current = running;
    sync();
    if (!running) flush();
  }, [running, sync, flush]);

  useEffect(() => {
    const onVisibility = () => {
      sync();
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => {
      fold();
      since.current = null;
      flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    const timer = window.setInterval(() => {
      fold();
      if (acc.current >= SAVE_EVERY_MS) flush();
    }, TICK_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(timer);
      // Leaving the problem inside the app (following a link): save what's left.
      fold();
      since.current = null;
      flush();
    };
  }, [fold, flush, sync]);

  /** Stops counting and returns the unsaved seconds (sent along with the rating). */
  const stopAndTake = useCallback((): number => {
    runningRef.current = false;
    fold();
    since.current = null;
    return take();
  }, [fold, take]);

  /** Puts seconds back when a rating didn't save, so they go out with the next save. */
  const giveBack = useCallback((seconds: number) => {
    acc.current += seconds * 1000;
  }, []);

  return { stopAndTake, giveBack };
}
