import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, eyebrow = "2026.7.1 - 2026.8.31", action }: PageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        <Badge tone="green">{eyebrow}</Badge>
        <h1 className="mt-3 max-w-full break-words text-xl font-semibold leading-tight tracking-normal sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
