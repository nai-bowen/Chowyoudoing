/*eslint-disable*/

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReviewManagement from '@/app/_components/ReviewManagement';

// Mock fetch
global.fetch = vi.fn();

// Mock FontAwesome
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: any, className?: string }) => (
    <span data-testid="mock-icon" className={className}>
      {typeof icon === 'object' && icon.iconName ? icon.iconName : 'icon'}
    </span>
  ),
}));

// Mock ReviewResponseModal
vi.mock('@/app/_components/ReviewResponseModal', () => ({
  default: ({ isOpen, onClose, review, onResponseSubmit }: any) => {
    return isOpen ? (
      <div data-testid="mock-response-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onResponseSubmit(review.id, 'Test response')}>Submit</button>
      </div>
    ) : null;
  },
}));

describe('ReviewManagement Component', () => {
  // Sample mock data
  const mockRestaurants = [
    { id: 'restaurant1', title: 'Restaurant One' },
    { id: 'restaurant2', title: 'Restaurant Two' },
  ];
  
  const mockReviews = [
    {
      id: 'review1',
      content: 'Great place!',
      rating: 5,
      upvotes: 10,
      createdAt: '2025-01-15T10:00:00Z',
      restaurantId: 'restaurant1',
      restaurantTitle: 'Restaurant One',
      restaurantResponse: null,
      patron: {
        id: 'patron1',
        firstName: 'John',
        lastName: 'Doe',
      },
      isAnonymous: false,
    },
    {
      id: 'review2',
      content: 'Average food.',
      rating: 3,
      upvotes: 5,
      createdAt: '2025-01-10T10:00:00Z',
      restaurantId: 'restaurant2',
      restaurantTitle: 'Restaurant Two',
      restaurantResponse: 'Thank you for your feedback!',
      patron: {
        id: 'patron2',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      isAnonymous: false,
    },
    {
      id: 'review3',
      content: 'Anonymous review.',
      rating: 4,
      upvotes: 2,
      createdAt: '2025-01-05T10:00:00Z',
      restaurantId: 'restaurant1',
      restaurantTitle: 'Restaurant One',
      restaurantResponse: null,
      patron: null,
      isAnonymous: true,
    },
  ];
  
  const mockPremiumStatus = {
    isPremium: false,
    responseQuota: {
      remaining: 1,
      resetAt: '2025-02-01T00:00:00Z',
    },
  };

  const mockOnStatsUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for fetch API
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/restaurateur/reviews')) {
        return {
          ok: true,
          json: () => Promise.resolve({ reviews: mockReviews }),
        } as Response;
      }
      
      if (typeof url === 'string' && url.includes('/api/restaurateur/premium')) {
        return {
          ok: true,
          json: () => Promise.resolve(mockPremiumStatus),
        } as Response;
      }
      
      return {
        ok: true,
        json: () => Promise.resolve({}),
      } as Response;
    });
  });



  test('displays reviews after loading', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Great place!')).toBeInTheDocument();
      expect(screen.getByText('Average food.')).toBeInTheDocument();
      expect(screen.getByText('Anonymous review.')).toBeInTheDocument();
    });
  });

  test('calculates and displays statistics correctly', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      // Wait for reviews to load
      expect(screen.getByText('Great place!')).toBeInTheDocument();
    });
    
    // Check statistics calculations
    const totalReviewsElement = screen.getByText('3');
    expect(totalReviewsElement).toBeInTheDocument();
    
    const pendingResponsesElement = screen.getByText('2');
    expect(pendingResponsesElement).toBeInTheDocument();
    
    // Verify stats were passed to parent
    expect(mockOnStatsUpdate).toHaveBeenCalledWith({
      totalReviews: 3,
      pendingResponses: 2,
      averageRating: 4, // (5 + 3 + 4) / 3 = 4
    });
  });

  test('filters reviews by restaurant', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      // Wait for reviews to load
      expect(screen.getByText('Great place!')).toBeInTheDocument();
    });
    
    // Select filter for Restaurant One
    const filterSelect = screen.getByLabelText(/Restaurant/i);
    fireEvent.change(filterSelect, { target: { value: 'restaurant1' } });
    
    // Should show only Restaurant One reviews
    expect(screen.getByText('Great place!')).toBeInTheDocument();
    expect(screen.getByText('Anonymous review.')).toBeInTheDocument();
    expect(screen.queryByText('Average food.')).not.toBeInTheDocument();
  });

  test('filters reviews by response status', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      // Wait for reviews to load
      expect(screen.getByText('Great place!')).toBeInTheDocument();
    });
    
    // Select filter for responded reviews
    const responseFilter = screen.getByLabelText(/Response Status/i);
    fireEvent.change(responseFilter, { target: { value: 'responded' } });
    
    // Should show only reviews with responses
    expect(screen.queryByText('Great place!')).not.toBeInTheDocument();
    expect(screen.getByText('Average food.')).toBeInTheDocument();
    expect(screen.queryByText('Anonymous review.')).not.toBeInTheDocument();
  });

  
  test('opens response modal when respond button is clicked', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      // Wait for reviews to load
      expect(screen.getByText('Great place!')).toBeInTheDocument();
    });
    
    // Find and click a respond button
    const respondButtons = screen.getAllByText(/Respond to Review/i);
    fireEvent.click(respondButtons[0]!);
    
    // Check if modal is open
    expect(screen.getByTestId('mock-response-modal')).toBeInTheDocument();
  });



  test('handles no reviews state gracefully', async () => {
    // Mock empty reviews array
    vi.mocked(global.fetch).mockImplementationOnce(async () => ({
      ok: true,
      json: () => Promise.resolve({ reviews: [] }),
    } as Response));
    
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/No reviews found/i)).toBeInTheDocument();
    });
  });

  test('displays premium status indicator for non-premium users', async () => {
    render(
      <ReviewManagement 
        restaurateurId="restaurateur1" 
        restaurants={mockRestaurants}
        onStatsUpdate={mockOnStatsUpdate}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Daily Response Limit/i)).toBeInTheDocument();
      expect(screen.getByText(/1 of 1 responses remaining today/i)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Premium/i)).toBeInTheDocument();
    });
  });
});