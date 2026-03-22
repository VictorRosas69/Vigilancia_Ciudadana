const ReportCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden animate-pulse"
    style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
    {/* Barra de color */}
    <div className="h-1 bg-gray-200" />
    {/* Imagen */}
    <div className="h-52 bg-gray-100" />
    <div className="px-4 pt-3.5 pb-4">
      <div className="h-4 bg-gray-100 rounded-xl w-3/4 mb-2" />
      <div className="h-4 bg-gray-100 rounded-xl w-full mb-1.5" />
      <div className="h-3 bg-gray-100 rounded-xl w-1/2 mb-4" />
      <div className="flex justify-between items-center pt-3.5 border-t border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-100 rounded-xl" />
          <div>
            <div className="h-3 bg-gray-100 rounded-lg w-16 mb-1" />
            <div className="h-2.5 bg-gray-100 rounded-lg w-20" />
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-lg w-16" />
      </div>
    </div>
  </div>
);

export default ReportCardSkeleton;
