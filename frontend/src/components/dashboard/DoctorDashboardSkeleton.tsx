/**
 * Loading placeholder for the doctor dashboard. Mirrors the real layout
 * (welcome banner, three stat cards, today's schedule) with pulsing blocks.
 */
export default function DoctorDashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-8 shadow-lg">
        <div className="h-8 w-48 max-w-full rounded-lg bg-white/30 mb-3" />
        <div className="h-5 w-96 max-w-full rounded-lg bg-white/20" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="h-12 w-12 rounded-xl bg-gray-200 mb-4" />
            <div className="h-8 w-24 rounded-lg bg-gray-200 mb-2" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 w-40 rounded-lg bg-gray-200 mb-2" />
          <div className="h-4 w-28 rounded bg-gray-200" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-6">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 max-w-full rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-8 w-24 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
