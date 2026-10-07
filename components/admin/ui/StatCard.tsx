import { cx } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cx("card-surface border border-line rounded-card p-6 transition-colors hover:border-champagne/50", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{label}</p>
          <p className="mt-2 font-serif text-3xl text-charcoal">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-line text-champagne shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}