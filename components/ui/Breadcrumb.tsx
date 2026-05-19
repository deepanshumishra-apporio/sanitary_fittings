import Link from "next/link";

type Item = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Item[] }) {
  return (
    <nav className="mb-8 flex items-center gap-2 text-xs text-zinc-400">
      <Link href="/" className="hover:text-zinc-900 transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="contents">
          <span>/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-zinc-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[200px] truncate text-zinc-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
