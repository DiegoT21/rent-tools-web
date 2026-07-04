import { api } from "@/lib/api";

export interface UserReview {
  uuid?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  reviewer?: {
    uuid?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface UserReviewsResponse {
  reviews: UserReview[];
  summary: { count: number; averageRating: number };
}

const unwrap = (response: any) => response?.data?.data ?? response?.data;

export const userService = {
  getReviews: async (userUuid: string): Promise<UserReviewsResponse> => {
    const response = await api.get(`/users/${encodeURIComponent(userUuid)}/reviews`);
    const data = unwrap(response);
    return {
      reviews: Array.isArray(data?.reviews)
        ? data.reviews.map((r: any) => ({
            ...r,
            rating: typeof r.ownerRating === "number" ? r.ownerRating : r.rating,
          }))
        : [],
      summary: data?.summary ?? { count: 0, averageRating: 0 },
    };
  },
};

