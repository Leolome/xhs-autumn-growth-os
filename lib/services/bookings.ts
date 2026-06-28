import { bookings as mockBookings } from "@/data/mock-invitations";
import { bookingStatusLabels } from "@/lib/constants";
import { createServerSupabaseDataClient } from "@/lib/supabase/server";
import { bookingToRow, mapBookingRow } from "@/lib/services/mappers";
import type { Booking, BookingStatus, IntentLevel, LeadStage } from "@/lib/types";

const bookingToLeadStage: Partial<Record<BookingStatus, LeadStage>> = {
  booked: "booked",
  arrived: "arrived",
  feedback_done: "arrived",
  strong_intent: "strong_intent",
  registered: "converted",
  not_now: "nurturing",
};

const bookingToIntent: Partial<Record<BookingStatus, IntentLevel>> = {
  strong_intent: "A",
  registered: "A",
  not_now: "C",
};

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return mockBookings;

  const { data, error } = await supabase.from("bookings").select("*").order("scheduled_at");
  if (error || !data?.length) return mockBookings;

  return data.map(mapBookingRow);
}

export async function upsertBooking(booking: Booking) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const { error } = await supabase.from("bookings").upsert([bookingToRow(booking)], { onConflict: "id" });
  return { ok: !error, error: error?.message };
}

export async function updateBookingStatus(bookingId: string, leadId: string, status: BookingStatus) {
  const supabase = await createServerSupabaseDataClient();
  if (!supabase) return { ok: true, fallback: true };

  const updates = [];
  updates.push(supabase.from("bookings").update({ status }).eq("id", bookingId));

  const leadStage = bookingToLeadStage[status];
  const intentLevel = bookingToIntent[status];
  if (leadStage || intentLevel) {
    updates.push(
      supabase
        .from("leads")
        .update({
          ...(leadStage ? { stage: leadStage } : {}),
          ...(intentLevel ? { intent_level: intentLevel } : {}),
          latest_activity: `邀约状态更新为 ${bookingStatusLabels[status]}`,
          latest_activity_at: new Date().toISOString(),
        })
        .eq("id", leadId),
    );
  }

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  return { ok: !error, error: error?.message };
}
