export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Desktop Skeleton */}
      <div className="hidden md:grid grid-cols-11 gap-6 w-full max-w-7xl mx-auto p-8">
        <div className="col-span-11 mb-4">
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="col-span-11 grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
            <div className="h-4 w-24 bg-teal-200 rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-teal-200 rounded animate-pulse" />
          </div>
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
            <div className="h-4 w-24 bg-rose-200 rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-rose-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden flex flex-col w-full pb-24">
        <div className="bg-[#4FB2A3] px-6 pt-12 pb-10 rounded-b-[2.5rem]">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-6" />
          <div className="h-12 w-full bg-white/30 rounded-full animate-pulse" />
        </div>
        <div className="px-6 -mt-4 space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 max-w-[85%]">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full bg-gradient-to-br from-[#4FB2A3] to-[#3B8D83] rounded-3xl p-5 h-64 animate-pulse" />
          <div className="pt-4">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
