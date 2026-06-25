import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimitedFetch, RateLimitError } from './rateLimitedFetch';

const VOLUME_MAX = 50;

// The breaker only reads response.status and response.headers.get('Retry-After'),
// so a minimal stub stands in for a real Response.
const ok = () => ({ status: 200, headers: { get: () => null } });
const tooMany = (retryAfter?: string) => ({
  status: 429,
  headers: {
    get: (key: string) =>
      key === 'Retry-After' ? (retryAfter ?? null) : null,
  },
});

// Breaker state is a per-host module singleton, so each test uses a fresh host
// to stay isolated without resetting modules.
let hostCounter = 0;
const uniqueUrl = () => `https://host-${hostCounter++}.test/endpoint`;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('rateLimitedFetch volume trigger', () => {
  it('opens after the volume cap and rejects further calls without hitting the network', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValue(ok());

    for (let i = 0; i < VOLUME_MAX; i++) {
      await expect(rateLimitedFetch(url)).resolves.toMatchObject({
        status: 200,
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(VOLUME_MAX);

    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);
    // The rejected call never touched the network.
    expect(fetchMock).toHaveBeenCalledTimes(VOLUME_MAX);
  });
});

describe('rateLimitedFetch failure trigger', () => {
  it('opens on a 429, using Retry-After as the cooldown', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValue(tooMany('30'));

    await expect(rateLimitedFetch(url)).rejects.toMatchObject({
      retryAfterMs: 30_000,
    });

    fetchMock.mockClear();
    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to the default cooldown when a 429 has no Retry-After', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValue(tooMany());

    await expect(rateLimitedFetch(url)).rejects.toMatchObject({
      retryAfterMs: 60_000,
    });
  });

  it('does not trip on a non-429 failure', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValueOnce({ status: 500, headers: { get: () => null } });

    await expect(rateLimitedFetch(url)).resolves.toMatchObject({ status: 500 });
    // Still closed: the next call reaches the network.
    fetchMock.mockResolvedValue(ok());
    await expect(rateLimitedFetch(url)).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('rateLimitedFetch recovery', () => {
  it('half-opens after the cooldown and closes on a successful probe', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValue(tooMany('30'));
    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);

    // Before the cooldown elapses: rejected without a network call.
    fetchMock.mockClear();
    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchMock).not.toHaveBeenCalled();

    // After the cooldown: a probe goes through and a success closes the breaker.
    vi.advanceTimersByTime(30_000);
    fetchMock.mockResolvedValue(ok());
    await expect(rateLimitedFetch(url)).resolves.toMatchObject({ status: 200 });
    await expect(rateLimitedFetch(url)).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects extra calls while a half-open probe is in flight', async () => {
    const url = uniqueUrl();
    fetchMock.mockResolvedValue(tooMany('30'));
    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);

    vi.advanceTimersByTime(30_000);

    // Keep the probe in flight so the breaker stays half-open.
    let resolveProbe!: (value: unknown) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => (resolveProbe = resolve)),
    );
    const probe = rateLimitedFetch(url);
    await expect(rateLimitedFetch(url)).rejects.toBeInstanceOf(RateLimitError);

    resolveProbe(ok());
    await expect(probe).resolves.toMatchObject({ status: 200 });
    // The initial 429 call and the probe; the in-flight extra call added none.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('rateLimitedFetch abort handling', () => {
  it('does not trip on AbortError and stays closed', async () => {
    const url = uniqueUrl();
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    fetchMock.mockRejectedValueOnce(abort);

    await expect(rateLimitedFetch(url)).rejects.toBe(abort);

    // Still closed: the next call reaches the network.
    fetchMock.mockResolvedValue(ok());
    await expect(rateLimitedFetch(url)).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
