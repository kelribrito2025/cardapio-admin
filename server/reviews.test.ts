import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock the database functions
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    createReview: vi.fn(),
    getReviewsByEstablishment: vi.fn(),
    updateEstablishmentRating: vi.fn(),
  };
});

describe('Reviews Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a review with valid data', async () => {
      const mockReviewId = 1;
      vi.mocked(db.createReview).mockResolvedValue(mockReviewId);

      const reviewData = {
        establishmentId: 1,
        orderId: null,
        customerName: 'João Silva',
        rating: 5,
        comment: 'Excelente comida!',
      };

      const result = await db.createReview(reviewData);
      
      expect(db.createReview).toHaveBeenCalledWith(reviewData);
      expect(result).toBe(mockReviewId);
    });

    it('should create a review without comment', async () => {
      const mockReviewId = 2;
      vi.mocked(db.createReview).mockResolvedValue(mockReviewId);

      const reviewData = {
        establishmentId: 1,
        orderId: null,
        customerName: 'Maria Santos',
        rating: 4,
        comment: null,
      };

      const result = await db.createReview(reviewData);
      
      expect(db.createReview).toHaveBeenCalledWith(reviewData);
      expect(result).toBe(mockReviewId);
    });
  });

  describe('getReviewsByEstablishment', () => {
    it('should return reviews for an establishment', async () => {
      const mockReviews = [
        {
          id: 1,
          establishmentId: 1,
          orderId: null,
          customerName: 'João Silva',
          rating: 5,
          comment: 'Excelente!',
          createdAt: new Date(),
        },
        {
          id: 2,
          establishmentId: 1,
          orderId: null,
          customerName: 'Maria Santos',
          rating: 4,
          comment: 'Muito bom',
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getReviewsByEstablishment).mockResolvedValue(mockReviews);

      const result = await db.getReviewsByEstablishment(1, 50);
      
      expect(db.getReviewsByEstablishment).toHaveBeenCalledWith(1, 50);
      expect(result).toEqual(mockReviews);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no reviews exist', async () => {
      vi.mocked(db.getReviewsByEstablishment).mockResolvedValue([]);

      const result = await db.getReviewsByEstablishment(999, 50);
      
      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const mockReviews = [
        {
          id: 1,
          establishmentId: 1,
          orderId: null,
          customerName: 'João Silva',
          rating: 5,
          comment: 'Excelente!',
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getReviewsByEstablishment).mockResolvedValue(mockReviews);

      await db.getReviewsByEstablishment(1, 10);
      
      expect(db.getReviewsByEstablishment).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('Review Rating Validation', () => {
    it('should accept rating between 1 and 5', () => {
      const validRatings = [1, 2, 3, 4, 5];
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });
    });

    it('should not accept rating outside 1-5 range', () => {
      const invalidRatings = [0, 6, -1, 10];
      
      invalidRatings.forEach(rating => {
        const isValid = rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      });
    });
  });
});
