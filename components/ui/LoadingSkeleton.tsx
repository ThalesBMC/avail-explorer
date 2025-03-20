export const LoadingSkeleton = ({
  itemsPerPage = 5,
}: {
  itemsPerPage?: number;
}) => (
  <div className="animate-pulse">
    <div className="space-y-4">
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-14 border-b border-gray-100 pb-4"
        >
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      ))}
    </div>
  </div>
);
