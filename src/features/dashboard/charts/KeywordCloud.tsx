'use client';

interface Props {
  data: { keyword: string; count: number }[];
}

export function KeywordCloud({ data }: Props) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-medium text-gray-700">Top Keywords</h3>
      <div className="mt-4">
        {data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            No keyword data yet
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.map((item) => {
              const ratio = item.count / maxCount;
              const size = ratio > 0.7 ? 'text-lg' : ratio > 0.4 ? 'text-base' : 'text-sm';
              const weight = ratio > 0.7 ? 'font-bold' : ratio > 0.4 ? 'font-medium' : 'font-normal';
              return (
                <span
                  key={item.keyword}
                  className={`inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700 ${size} ${weight}`}
                  title={`${item.count} occurrences`}
                >
                  {item.keyword}
                  <span className="text-xs text-blue-400">{item.count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
