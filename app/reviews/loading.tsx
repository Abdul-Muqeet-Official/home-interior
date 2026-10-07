/**
 * app/reviews/loading.tsx
 * Scoped skeleton for the reviews page only — this segment never 404s, so a
 * streamed shell is safe here. Detail routes keep server-blocking rendering so
 * notFound() produces a real HTTP 404 status.
 */

export default function ReviewsLoading() {
  return (
    <main id="main" aria-busy="true" aria-live="polite">
      <div className="container-wide py-24">
        <span className="sr-only">Loading client impressions</span>

        <div className="h-3 w-32 animate-pulse rounded-full bg-surface" />
        <div className="mt-6 h-12 w-full max-w-2xl animate-pulse rounded-panel bg-surface" />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <div key={key} className="animate-pulse rounded-card border border-line bg-white p-8">
              <div className="h-4 w-10 rounded-full bg-surface" />
              <div className="mt-6 h-3 w-full rounded-full bg-surface" />
              <div className="mt-3 h-3 w-11/12 rounded-full bg-surface" />
              <div className="mt-3 h-3 w-4/5 rounded-full bg-surface" />
              <div className="mt-8 h-3 w-32 rounded-full bg-surface" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
