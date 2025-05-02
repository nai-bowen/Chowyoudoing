/*eslint-disable*/

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id' }
  })
}));

vi.mock('@/server/db', () => {
  const mockPrisma = {
    restaurant: {
      findUnique: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
    },
    menuSection: {
      findMany: vi.fn(),
    },
  };

  return {
    db: mockPrisma,
  };
});

import { db } from '@/server/db';
import { GET } from '@/app/api/restaurants/[restaurantId]/route';

describe('Restaurant API Route', () => {
  const mockRestaurant = {
    id: 'restaurant1',
    title: 'Test Restaurant',
    location: 'Test Location',
    category: ['Italian', 'Pizza'],
    rating: '4.5',
    num_reviews: '42',
    detail: 'A detailed description',
    interests: ['Pizza', 'Pasta'],
    widerAreas: ['Downtown', 'City Center'],
    reviews: [],
    menuSections: [],
  };

  const mockReviews: any[] = [
    {
      id: 'review1',
      content: 'Great food!',
      rating: 5,
      upvotes: 10,
      createdAt: new Date(),
      patronId: 'user1',
      isAnonymous: false,
      isVerified: true,
      restaurantResponse: null,
      menuItemId: null,
      latitude: null,
      longitude: null,
      patron: {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        isCertifiedFoodie: true,
      },
      votes: [],
    },
  ];

  const mockMenuSections: any[] = [
    {
      id: 'section1',
      category: 'Starters',
      items: [
        {
          id: 'item1',
          name: 'Garlic Bread',
          description: 'Freshly baked',
          price: '4.99',
          status: 'active',
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.restaurant.findUnique).mockResolvedValue({
      ...mockRestaurant,
      reviews: mockReviews,
      menuSections: mockMenuSections,
    } as any);
    vi.mocked(db.review.findMany).mockResolvedValue(mockReviews as any);
    vi.mocked(db.menuSection.findMany).mockResolvedValue(mockMenuSections as any);
  });

  it('returns 404 when restaurant is not found', async () => {
    vi.mocked(db.restaurant.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/restaurants/non-existent');
    const response = await GET(request, { params: Promise.resolve({ restaurantId: 'non-existent' }) });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Restaurant not found' });
  });

  it('handles request with includeMenuItems=false parameter', async () => {
    const url = new URL('http://localhost:3000/api/restaurants/restaurant1');
    url.searchParams.append('includeMenuItems', 'false');

    const request = new NextRequest(url);
    await GET(request, { params: Promise.resolve({ restaurantId: 'restaurant1' }) });

    expect(db.menuSection.findMany).not.toHaveBeenCalled();
  });

  it('handles request with includeReviews=false parameter', async () => {
    const url = new URL('http://localhost:3000/api/restaurants/restaurant1');
    url.searchParams.append('includeReviews', 'false');

    const request = new NextRequest(url);
    await GET(request, { params: Promise.resolve({ restaurantId: 'restaurant1' }) });

    expect(db.review.findMany).not.toHaveBeenCalled();
  });
});