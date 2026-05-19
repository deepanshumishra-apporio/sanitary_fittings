interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  accent = "bg-orange-50 text-orange-500",
}: Props) {
  return (
    <div className="border border-zinc-100 bg-white p-6 shadow-sm">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center ${accent}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
