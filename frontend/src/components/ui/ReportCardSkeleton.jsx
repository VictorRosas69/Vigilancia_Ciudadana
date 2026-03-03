const ReportCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4">
      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-1" />
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="flex justify-between pt-3 border-t border-gray-50">
        <div className="h-6 bg-gray-200 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

export default ReportCardSkeleton;