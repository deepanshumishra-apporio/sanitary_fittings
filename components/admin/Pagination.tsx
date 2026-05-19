import type { PaginatedMeta } from "@/lib/types";

interface Props {
  meta: PaginatedMeta;
  page: number;
  onPage: (p: number) => void;
}

export default function Pagination({ meta, page, onPage }: Props) {
  if (meta.pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-zinc-400">
        Page {meta.page} of {meta.pages} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= meta.pages}
          onClick={() => onPage(page + 1)}
          className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
