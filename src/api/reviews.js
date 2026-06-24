// src/api/reviews.js — service-provider reviews
import api from './axiosInstance';

/** { providerId, average, count, canReview, reason, myReview, reviews } */
export async function getProviderReviews(providerId) {
  const { data } = await api.get(`/api/services/providers/${providerId}/reviews`);
  return data;
}

export async function submitProviderReview(providerId, { rating, comment }) {
  const { data } = await api.post(`/api/services/providers/${providerId}/reviews`, { rating, comment });
  return data;
}

export async function deleteProviderReview(providerId) {
  await api.delete(`/api/services/providers/${providerId}/reviews`);
}
