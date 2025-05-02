/*eslint-disable*/

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TrendingCategories } from '../../app/_components/TrendingCategories';
import { useRouter } from 'next/navigation';
import React from 'react';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('TrendingCategories', () => {
  const mockTrendingData = {
    trending: {
      category: 'Pizza',
      count: 120,
      lastUpdated: new Date().toISOString(),
    },
    recentCategories: [
      { category: 'Burgers', count: 95 },
      { category: 'Sushi', count: 85 },
      { category: 'Tacos', count: 70 },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrendingData),
      })
    ) as any;
  });


  it('renders trending and recent categories after fetch', async () => {
    render(<TrendingCategories displayCount={4} />);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burgers')).toBeInTheDocument();
      expect(screen.getByText('Sushi')).toBeInTheDocument();
      expect(screen.getByText('Tacos')).toBeInTheDocument();
    });
  });

  

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false })) as any;

    render(<TrendingCategories />);

    await waitFor(() => {
      expect(screen.queryByText('Pizza')).not.toBeInTheDocument();
    });
  });
});
