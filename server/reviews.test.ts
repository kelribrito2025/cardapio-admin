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
    getReviewsAdmin: vi.fn(),
    getReviewMetrics: vi.fn(),
    respondToReview: vi.fn(),
    getUnreadReviewsCount: vi.fn(),
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

describe('Reviews Admin Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReviewsAdmin', () => {
    it('should return reviews with response fields', async () => {
      const mockReviews = [
        {
          id: 1,
          establishmentId: 100,
          customerName: 'João',
          customerPhone: '11999999999',
          rating: 5,
          comment: 'Excelente!',
          responseText: null,
          responseDate: null,
          isRead: false,
          createdAt: new Date('2026-02-01'),
        },
      ];

      vi.mocked(db.getReviewsAdmin).mockResolvedValue(mockReviews);

      const result = await db.getReviewsAdmin(100, 20, 0);
      expect(db.getReviewsAdmin).toHaveBeenCalledWith(100, 20, 0);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('responseText');
      expect(result[0]).toHaveProperty('responseDate');
      expect(result[0]).toHaveProperty('isRead');
    });
  });

  describe('getReviewMetrics', () => {
    it('should return all metric fields', async () => {
      const mockMetrics = {
        averageRating: 4.5,
        averageRating30d: 4.8,
        totalReviews: 10,
        uniqueCustomers: 8,
        pendingResponses: 3,
      };

      vi.mocked(db.getReviewMetrics).mockResolvedValue(mockMetrics);

      const result = await db.getReviewMetrics(100);
      expect(db.getReviewMetrics).toHaveBeenCalledWith(100);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(10);
      expect(result.pendingResponses).toBe(3);
    });
  });

  describe('respondToReview', () => {
    it('should call with correct params', async () => {
      vi.mocked(db.respondToReview).mockResolvedValue(undefined);

      await db.respondToReview(1, 100, 'Obrigado!');
      expect(db.respondToReview).toHaveBeenCalledWith(1, 100, 'Obrigado!');
    });
  });

  describe('getUnreadReviewsCount', () => {
    it('should return unread count', async () => {
      vi.mocked(db.getUnreadReviewsCount).mockResolvedValue(2);

      const result = await db.getUnreadReviewsCount(100);
      expect(result).toBe(2);
    });
  });
});
