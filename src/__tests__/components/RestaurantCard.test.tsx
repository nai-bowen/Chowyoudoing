/*eslint-disable*/

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RestaurantCard from '@/app/_components/RestaurantCard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href} data-testid="mock-link">{children}</a>
  ),
}));

// Mock FontAwesome
vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: any, className?: string }) => (
    <span data-testid="mock-icon" className={className}>
      {icon.iconName}
    </span>
  ),
}));

describe('RestaurantCard Component', () => {
  const mockRestaurant = {
    id: 'restaurant1',
    title: 'Test Restaurant',
    location: 'Test Location',
    category: ['Italian', 'Pizza'],
    rating: '4.5',
    num_reviews: '42',
    _count: {
      reviews: 42
    }
  };

  test('renders restaurant information correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    // Check restaurant name
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    
    // Check location
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    
    // Check categories
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    
    // Check review count
    expect(screen.getByText('42 Reviews')).toBeInTheDocument();
  });



  test('displays single review text correctly', () => {
    const singleReviewRestaurant = {
      ...mockRestaurant,
      num_reviews: '1',
      _count: {
        reviews: 1
      }
    };
    
    render(<RestaurantCard restaurant={singleReviewRestaurant} />);
    
    // Check for singular form
    expect(screen.getByText('1 Review')).toBeInTheDocument();
  });

  test('handles array category', () => {
    const arrayCategories = {
      ...mockRestaurant,
      category: ['Italian', 'Pizza', 'Pasta', 'Seafood'] // More than 3 categories
    };
    
    render(<RestaurantCard restaurant={arrayCategories} />);
    
    // Should show the first 3 categories
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    
    // Should show "+1 more" indicator
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  test('handles string category', () => {
    const stringCategory = {
      ...mockRestaurant,
      category: 'Italian' // String instead of array
    };
    
    render(<RestaurantCard restaurant={stringCategory} />);
    
    // Should display the single category
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  test('contains correct dashboard link', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    const manageLink = screen.getByText('Manage');
    const linkElement = manageLink.closest('a');
    
    expect(linkElement).toHaveAttribute('href', `/restaurant-dashboard/${mockRestaurant.id}`);
  });

  test('contains correct analytics link', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />);
    
    const analyticsLink = screen.getByText('Analytics');
    const linkElement = analyticsLink.closest('a');
    
    expect(linkElement).toHaveAttribute('href', `/restaurant-dashboard/${mockRestaurant.id}/analytics`);
  });
});