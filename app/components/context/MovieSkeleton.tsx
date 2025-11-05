export default function MovieSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow animate-pulse w-[220px]">
      <div className="w-full h-[330px] bg-gray-200 rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
          <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
