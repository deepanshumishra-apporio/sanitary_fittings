interface Props {
  columns: string[];
  loading?: boolean;
  isEmpty?: boolean;
  empty?: string;
  children?: React.ReactNode;
}

export default function AdminTable({
  columns,
  loading,
  isEmpty,
  empty = "No data found",
  children,
}: Props) {
  return (
    <div className="overflow-hidden border border-zinc-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-zinc-400">
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
