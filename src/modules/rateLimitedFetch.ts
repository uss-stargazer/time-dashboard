// A drop-in `fetch` replacement that fronts every tracker API call with a
// per-host circuit breaker. It guards against two things:
//   1. Render-loop bugs flooding an API (proactive *volume* trigger).
//   2. Genuine rate limiting (reactive *429* trigger, honoring Retry-After).
// There are no in-call retries: a 429 (or a volume overflow) simply opens the
// breaker, and callers fail fast with a RateLimitError carrying retryAfterMs.
// State is an in-memory, per-host singleton, so it survives React re-renders
// and remounts (a render loop can't reset it) and resets on page reload.

const VOLUME_WINDOW_MS = 10_000; // rolling window for the volume trigger
const VOLUME_MAX_REQUESTS = 50; // > this many initiated requests / window / host → open
const DEFAULT_COOLDOWN_MS = 60_000; // used when a 429 carries no Retry-After
const HALF_OPEN_RETRY_MS = 2_000; // nudge for calls rejected while a probe is in flight
const HALF_OPEN_PROBES = 1; // concurrent probes allowed while testing recovery

export class RateLimitError extends Error {
  public retryAfterMs: number;
  constructor(retryAfterMs: number, message?: string) {
    super(
      message ??
        `Rate limited; retrying in ~${Math.ceil(retryAfterMs / 1000)}s`,
    );
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

type BreakerState = {
  status: 'closed' | 'open' | 'half-open';
  requests: number[]; // timestamps (ms) of initiated requests within the window
  openUntil: number; // epoch ms the breaker stays open until
  probesInFlight: number;
};

const breakers = new Map<string, BreakerState>();

function getBreaker(host: string): BreakerState {
  let state = breakers.get(host);
  if (!state) {
    state = { status: 'closed', requests: [], openUntil: 0, probesInFlight: 0 };
    breakers.set(host, state);
  }
  return state;
}

function trip(state: BreakerState, cooldownMs: number) {
  state.status = 'open';
  state.openUntil = Date.now() + cooldownMs;
  state.probesInFlight = 0;
}

// Mark the rate limit as cleared. Only resets when transitioning *out* of a
// non-closed state — when already closed this is a no-op, so a normal stream of
// successful requests keeps accumulating in the volume window.
function markCleared(state: BreakerState) {
  if (state.status !== 'closed') {
    state.status = 'closed';
    state.openUntil = 0;
    state.probesInFlight = 0;
    state.requests = [];
  }
}

function hostOf(input: RequestInfo | URL): string {
  if (input instanceof URL) return input.host;
  if (typeof input === 'string') return new URL(input).host;
  return new URL(input.url).host;
}

function parseRetryAfterMs(headerValue: string | null): number | null {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(headerValue);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return null;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export async function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const state = getBreaker(hostOf(input));
  const now = Date.now();

  // An open breaker whose cooldown has elapsed becomes half-open: it lets a
  // limited number of probes through to test whether the limit has lifted.
  if (state.status === 'open' && now >= state.openUntil) {
    state.status = 'half-open';
    state.probesInFlight = 0;
  }

  if (state.status === 'open') {
    throw new RateLimitError(state.openUntil - now);
  }

  let isProbe = false;
  if (state.status === 'half-open') {
    if (state.probesInFlight >= HALF_OPEN_PROBES) {
      throw new RateLimitError(HALF_OPEN_RETRY_MS);
    }
    isProbe = true;
    state.probesInFlight++;
  } else {
    // Closed: account for this request in the rolling volume window. Aborted
    // requests still count — they were initiated, which is what we're detecting.
    state.requests = state.requests.filter((t) => t > now - VOLUME_WINDOW_MS);
    state.requests.push(now);
    if (state.requests.length > VOLUME_MAX_REQUESTS) {
      trip(state, DEFAULT_COOLDOWN_MS);
      throw new RateLimitError(
        DEFAULT_COOLDOWN_MS,
        `Rate limited (request volume too high); retrying in ~${DEFAULT_COOLDOWN_MS / 1000}s`,
      );
    }
  }

  try {
    const response = await fetch(input, init);
    if (response.status === 429) {
      const retryAfterMs =
        parseRetryAfterMs(response.headers.get('Retry-After')) ??
        DEFAULT_COOLDOWN_MS;
      trip(state, retryAfterMs);
      throw new RateLimitError(retryAfterMs);
    }
    // Any non-429 response means rate limiting isn't (or is no longer) in effect.
    markCleared(state);
    return response;
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    if (isAbortError(err)) {
      // Aborts teach us nothing about the rate limit; just release the probe slot.
      if (isProbe) state.probesInFlight = Math.max(0, state.probesInFlight - 1);
      throw err;
    }
    // A non-429 failure (network, 5xx, …) is a different problem, not rate
    // limiting — let recovery proceed rather than holding the breaker open.
    markCleared(state);
    throw err;
  }
}
