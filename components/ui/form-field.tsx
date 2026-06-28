import { cn } from "@/lib/utils";

export function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)]";

export const textareaClass =
  "min-h-20 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)]";

