import { randomUUID } from 'crypto';

export type DevSearchResult = {
  id: string;
  sessionId: string;
  title: string;
  brand: string | null;
  image: string;
  store: string;
  price: number;
  currency: string;
  shippingPrice: number | null;
  condition: string | null;
  availability: string | null;
  rating: number | null;
  reviewCount: number | null;
  marketplace: string | null;
  productUrl: string;
  matchScore: number;
  rawProvider: string;
  rawJson: string;
};

export type DevSearchSession = {
  id: string;
  createdAt: Date;
  imageUrl: string;
  query: string | null;
  country: string | null;
  status: string;
  results: DevSearchResult[];
};

const sessions = new Map<string, DevSearchSession>();

export function createDevSession(input: {
  imageUrl: string;
  query: string | null;
  country: string | null;
  status: string;
}): DevSearchSession {
  const session: DevSearchSession = {
    id: randomUUID(),
    createdAt: new Date(),
    imageUrl: input.imageUrl,
    query: input.query,
    country: input.country,
    status: input.status,
    results: []
  };
  sessions.set(session.id, session);
  return session;
}

export function getDevSession(id: string): DevSearchSession | null {
  return sessions.get(id) ?? null;
}

export function getLatestDevSessions(limit = 5): DevSearchSession[] {
  return Array.from(sessions.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function updateDevSessionStatus(id: string, status: string): void {
  const session = sessions.get(id);
  if (!session) return;
  session.status = status;
}

export function saveDevResults(id: string, results: DevSearchResult[]): void {
  const session = sessions.get(id);
  if (!session) return;
  session.results = results;
}
