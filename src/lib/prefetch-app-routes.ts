let prefetched = false;

export function prefetchAppRoutes() {
  if (prefetched || typeof window === "undefined") return;
  prefetched = true;

  void import("@/pages/app/DashboardPage");
  void import("@/pages/app/VentasPage");
  void import("@/pages/inbox/InboxPage");
}
