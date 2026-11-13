import { Skeleton } from "@/app/ui";

/** Loading state of the work page (DESIGN.md 9.3): title, meta, about card, 24 trope pills. */
export function WorkSkeleton() {
  return (
    <div className="pt-2" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading the work.
      </p>
      <Skeleton shape="circle" width={48} height={48} />
      <div className="mt-8 grid gap-3">
        <Skeleton width={96} height={12} />
        <Skeleton width="60%" height={40} />
        <Skeleton width={110} height={14} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Skeleton width={190} height={40} />
        <Skeleton width={96} height={40} />
        <Skeleton width={170} height={40} />
      </div>
      <Skeleton shape="block" height={168} className="mt-10 block rounded-l" />
      <div className="mt-12 grid gap-4">
        <Skeleton width={140} height={20} />
        <Skeleton height={48} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 24 }, (_, i) => (
          <Skeleton key={i} width={80 + ((i * 37) % 90)} height={32} />
        ))}
      </div>
    </div>
  );
}
