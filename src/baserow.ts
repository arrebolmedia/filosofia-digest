import 'dotenv/config';

const BASEROW_URL      = process.env.BASEROW_URL      ?? 'https://data.arrebolweddings.com';
const BASEROW_DB_TOKEN = process.env.BASEROW_DB_TOKEN ?? '';
const BASEROW_TABLE    = 839;

export interface Subscriber {
  id:            number;
  Email:         string;
  moduleIndex:   number;
  partIndex:     number;
  active:        boolean;
  subscribedAt?: string;
}

function authHeaders(): Record<string, string> {
  return {
    'Authorization': `Token ${BASEROW_DB_TOKEN}`,
    'Accept':        'application/json',
  };
}

export function isBaserowConfigured(): boolean {
  return BASEROW_DB_TOKEN.length > 0;
}

export async function baserowGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASEROW_URL}${path}`, { headers: authHeaders() });
  return res.json();
}

export async function baserowPost(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASEROW_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body:   JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

export async function baserowPatch(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASEROW_URL}${path}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body:   JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

function coerce(raw: unknown): Subscriber {
  const r = raw as Record<string, unknown>;
  return {
    id:           Number(r.id),
    Email:        String(r.Email ?? ''),
    moduleIndex:  Number(r.moduleIndex ?? 1),
    partIndex:    Number(r.partIndex ?? 0),
    active:       Boolean(r.active),
    subscribedAt: r.subscribedAt ? String(r.subscribedAt) : undefined,
  };
}

export async function listActiveSubscribers(): Promise<Subscriber[]> {
  const data = await baserowGet(
    `/api/database/rows/table/${BASEROW_TABLE}/?user_field_names=true&size=200&filter__active__boolean=true`
  ) as { results?: unknown[] };
  return (data.results ?? []).map(coerce);
}

export async function findSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const data = await baserowGet(
    `/api/database/rows/table/${BASEROW_TABLE}/?user_field_names=true&search=${encodeURIComponent(email)}&size=1`
  ) as { results?: unknown[] };
  const first = data.results?.[0];
  return first ? coerce(first) : null;
}

export async function createSubscriber(email: string): Promise<void> {
  await baserowPost(
    `/api/database/rows/table/${BASEROW_TABLE}/?user_field_names=true`,
    {
      Email:        email,
      moduleIndex:  1,
      partIndex:    0,
      active:       true,
      subscribedAt: new Date().toISOString(),
    }
  );
}

export async function updateSubscriberProgress(
  id: number,
  moduleIndex: number,
  partIndex: number,
): Promise<void> {
  await baserowPatch(
    `/api/database/rows/table/${BASEROW_TABLE}/${id}/?user_field_names=true`,
    { moduleIndex, partIndex }
  );
}
