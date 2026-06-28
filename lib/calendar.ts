import { productPeriod } from "@/lib/constants";

export function getDateRange(start = productPeriod.start, end = productPeriod.end) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getWeekdayLabel(date: string) {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${date}T00:00:00`));
}

export function isEveryOtherDay(date: string) {
  const start = new Date(`${productPeriod.start}T00:00:00`).getTime();
  const current = new Date(`${date}T00:00:00`).getTime();
  const diff = Math.floor((current - start) / 86400000);
  return diff % 2 === 0;
}

