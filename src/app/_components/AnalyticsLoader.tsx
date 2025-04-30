// app/restaurant-dashboard/analytics/AnalyticsLoader.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function AnalyticsLoader({
  onRestaurantIdResolved,
}: {
  onRestaurantIdResolved: (id: string | null) => void;
}): null {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  onRestaurantIdResolved(restaurantId);
  return null;
}
