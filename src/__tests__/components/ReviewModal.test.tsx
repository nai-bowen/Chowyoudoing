/*eslint-disable*/

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReviewModal from '@/app/_components/ReviewModal';

// Mock the fetch function
global.fetch = vi.fn();

// Sample review data
const mockReview = {
  id: '1',
  content: 'This place is amazing! Great food and service.',
  rating: 5,
  patron: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe'
  },
  imageUrl: '/test-image.jpg',
  date: '2025-01-15',
  upvotes: 10,
};

describe('ReviewModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnVoteUpdate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for fetch
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });



  test('calls onClose when close button is clicked', () => {
    render(
      <ReviewModal 
        isOpen={true}
        review={mockReview}
        onClose={mockOnClose}
        onVoteUpdate={mockOnVoteUpdate}
      />
    );
    
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[1]!); // or 0, depending on which you want
    
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles upvote action correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        upvotes: 11, 
        isUpvote: true
      }),
    } as Response);

    render(
      <ReviewModal 
        isOpen={true}
        review={mockReview}
        onClose={mockOnClose}
        onVoteUpdate={mockOnVoteUpdate}
      />
    );
    
    const upvoteButton = screen.getByRole('button', { name: /upvote/i });
    fireEvent.click(upvoteButton);
    
    await waitFor(() => {
      expect(mockOnVoteUpdate).toHaveBeenCalledWith(
        mockReview.id,
        11, // New upvote count
        true // isUpvoted
      );
    });
  });

  test('doesn\'t render if isOpen is false', () => {
    render(
      <ReviewModal 
        isOpen={false}
        review={mockReview}
        onClose={mockOnClose}
        onVoteUpdate={mockOnVoteUpdate}
      />
    );
    
    // The modal should not be in the document
    expect(screen.queryByText(mockReview.content)).not.toBeInTheDocument();
  });

  test('displays image when provided', () => {
    render(
      <ReviewModal 
        isOpen={true}
        review={mockReview}
        onClose={mockOnClose}
        onVoteUpdate={mockOnVoteUpdate}
      />
    );
    
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toMatch(/test-image.jpg/);
});
});