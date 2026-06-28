import type { GrowthTask, IntentLevel } from "@/lib/types";

export function getIntentLevel(score: number): IntentLevel {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score > 0) return "D";
  return "F";
}

export function getContentEffectiveness(task: GrowthTask) {
  const metrics = task.metrics;
  if (!metrics) return 0;

  return (
    metrics.likes * 1 +
    metrics.saves * 2 +
    metrics.comments * 3 +
    metrics.dm * 6 +
    metrics.assessments * 8 +
    metrics.bookings * 12
  );
}

