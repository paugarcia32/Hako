export default function InboxLoading() {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />
        <div className="mt-1 h-4 w-56 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
      </div>
      <div className="mb-6 h-10 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
      <div className="space-y-3">
        {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((id) => (
          <div key={id} className="h-20 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
        ))}
      </div>
    </div>
  );
}
