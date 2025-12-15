export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const EXERCISES_API = `${API_BASE}/api/exercises`;
export const WORKOUTS_API = `${API_BASE}/api/workouts`;