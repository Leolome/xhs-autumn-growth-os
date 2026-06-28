import type { IntentBucket, IntentLevel } from "@/lib/types";

export const intentBucketLabels: Record<IntentBucket, string> = {
  high: "高意向",
  medium: "中意向",
  low: "低意向",
};

export function intentLevelToBucket(intentLevel: IntentLevel): IntentBucket {
  if (intentLevel === "A" || intentLevel === "B") return "high";
  if (intentLevel === "C") return "medium";
  return "low";
}

export function bucketToIntentLevel(bucket: IntentBucket): IntentLevel {
  if (bucket === "high") return "A";
  if (bucket === "medium") return "C";
  return "F";
}

export function bucketToIntentScore(bucket: IntentBucket) {
  if (bucket === "high") return 88;
  if (bucket === "medium") return 60;
  return 28;
}

export function getIntentBucketTone(bucket: IntentBucket): "green" | "amber" | "slate" {
  if (bucket === "high") return "green";
  if (bucket === "medium") return "amber";
  return "slate";
}
