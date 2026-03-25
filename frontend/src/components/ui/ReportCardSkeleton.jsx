const shimmer = {
  background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite linear',
};

const ReportCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden"
    style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}>
    {/* Color bar */}
    <div className="h-1 rounded-none" style={shimmer} />
    {/* Image placeholder */}
    <div className="h-52 relative overflow-hidden" style={{ background: '#f1f5f9' }}>
      <div className="absolute inset-0" style={shimmer} />
      {/* Status badge skeleton */}
      <div className="absolute top-3 left-3 h-6 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
      {/* Priority badge skeleton */}
      <div className="absolute top-3 right-3 h-6 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.6)' }} />
    </div>
    <div className="px-4 pt-3.5 pb-4">
      {/* Title lines */}
      <div className="h-4 rounded-xl mb-2 overflow-hidden" style={{ background: '#f1f5f9', width: '75%' }}>
        <div className="h-full" style={shimmer} />
      </div>
      <div className="h-4 rounded-xl mb-1.5 overflow-hidden" style={{ background: '#f1f5f9', width: '100%' }}>
        <div className="h-full" style={shimmer} />
      </div>
      <div className="h-3 rounded-xl mb-4 overflow-hidden" style={{ background: '#f1f5f9', width: '50%' }}>
        <div className="h-full" style={shimmer} />
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center pt-3.5 border-t border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden" style={{ background: '#f1f5f9' }}>
            <div className="h-full" style={shimmer} />
          </div>
          <div>
            <div className="h-3 rounded-lg mb-1 overflow-hidden" style={{ background: '#f1f5f9', width: '64px' }}>
              <div className="h-full" style={shimmer} />
            </div>
            <div className="h-2.5 rounded-lg overflow-hidden" style={{ background: '#f1f5f9', width: '80px' }}>
              <div className="h-full" style={shimmer} />
            </div>
          </div>
        </div>
        <div className="h-3 rounded-lg overflow-hidden" style={{ background: '#f1f5f9', width: '64px' }}>
          <div className="h-full" style={shimmer} />
        </div>
      </div>
    </div>
  </div>
);

export default ReportCardSkeleton;
