import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  tone?: "slate" | "green" | "amber" | "red" | "blue" | "muted";
  trend?: string;
}

export function MetricCard({ label, value, detail, tone = "slate", trend }: MetricCardProps) {
  return (
    <Card className="min-h-[118px]">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
          {trend ? <Badge tone={tone}>{trend}</Badge> : null}
        </div>
        <div className="mt-3">
          <div className={cn("text-3xl font-semibold tracking-normal", tone === "red" && "text-red-700")}>{value}</div>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

