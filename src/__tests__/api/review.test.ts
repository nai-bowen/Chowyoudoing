/*eslint-disable*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../../app/api/review/route';
import { NextRequest } from 'next/server';
import type { Mock } from 'vitest';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/server/db', () => {
  return {
    db: {
      review: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      restaurant: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      menuItem: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      patron: {
        findUnique: vi.fn(),
      },
      $executeRaw: vi.fn(),
      $queryRaw: vi.fn(),
    }
  }
});


const { getServerSession } = await import('next-auth/next');
const { db } = await import('@/server/db');

function createMockRequest(url: string, method = 'GET', body?: any): NextRequest {
  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return new NextRequest(request);
}

describe('Reviews API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET - returns empty reviews and pagination', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
  
    (vi.mocked(db.review.findMany) as Mock).mockResolvedValue([]);
    (vi.mocked(db.review.count) as Mock).mockResolvedValue(0);
  
    const request = createMockRequest('http://localhost/api/reviews');
    const response = await GET(request);
    const json = await response.json();
  
    expect(response.status).toBe(200);
    expect(json.reviews).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it('POST - returns 401 for unauthenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const body = {
      restaurant: 'Mock Place',
      content: 'Nice food!'
    };

    const request = createMockRequest('http://localhost/api/reviews', 'POST', body);
    const response = await POST(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toContain('Unauthorized');
  });

  it('POST - creates review with new restaurant', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user123' } } as any);
  
    (vi.mocked(db.restaurant.findFirst) as Mock).mockResolvedValue(null);
    (vi.mocked(db.restaurant.create) as Mock).mockResolvedValue({ id: 'rest1', title: 'Mock Place', num_reviews: '0' });
    (vi.mocked(db.patron.findUnique) as Mock).mockResolvedValue({ id: 'user123' });
    (vi.mocked(db.review.create) as Mock).mockResolvedValue({ id: 'rev1' });
    (vi.mocked(db.restaurant.update) as Mock).mockResolvedValue({});
  
    const body = {
      restaurant: 'Mock Place',
      content: 'Nice food! This is a longer review.',
      rating: 4
    };
  
    const request = createMockRequest('http://localhost/api/reviews', 'POST', body);
    const response = await POST(request);
  
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.reviewId).toBe('rev1');
  });
  
});