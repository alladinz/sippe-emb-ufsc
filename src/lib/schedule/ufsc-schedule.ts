export interface UFSCTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  period: "Manhã" | "Tarde" | "Noite";
  index: number;
}

export const UFSC_TIME_SLOTS: UFSCTimeSlot[] = [
  { id: "07:30 - 08:20", startTime: "07:30", endTime: "08:20", period: "Manhã", index: 0 },
  { id: "08:40 - 09:30", startTime: "08:40", endTime: "09:30", period: "Manhã", index: 1 },
  { id: "09:30 - 10:20", startTime: "09:30", endTime: "10:20", period: "Manhã", index: 2 },
  { id: "10:30 - 11:20", startTime: "10:30", endTime: "11:20", period: "Manhã", index: 3 },
  { id: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", period: "Manhã", index: 4 },
  { id: "13:30 - 14:20", startTime: "13:30", endTime: "14:20", period: "Tarde", index: 5 },
  { id: "14:20 - 15:10", startTime: "14:20", endTime: "15:10", period: "Tarde", index: 6 },
  { id: "15:10 - 16:00", startTime: "15:10", endTime: "16:00", period: "Tarde", index: 7 },
  { id: "16:20 - 17:10", startTime: "16:20", endTime: "17:10", period: "Tarde", index: 8 },
  { id: "17:10 - 18:00", startTime: "17:10", endTime: "18:00", period: "Tarde", index: 9 },
  { id: "18:00 - 18:50", startTime: "18:00", endTime: "18:50", period: "Noite", index: 10 },
  { id: "18:50 - 19:40", startTime: "18:50", endTime: "19:40", period: "Noite", index: 11 },
];

export const UFSC_WEEKDAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export interface ScheduleDayInput {
  day: string;
  enabled: boolean;
  slots?: string[];
  startTime?: string;
  endTime?: string;
}

export interface ContiguousScheduleBlock {
  startTime: string;
  endTime: string;
  label: string;
  credits: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Merges consecutive UFSC grid slots within the same shift (allowing up to 20 min recess breaks)
 * while keeping separated periods (e.g. morning vs afternoon lunch gap) distinct.
 */
export function groupContiguousSlots(slots: string[]): ContiguousScheduleBlock[] {
  const validSlots = slots
    .map((id) => UFSC_TIME_SLOTS.find((s) => s.id === id))
    .filter((s): s is UFSCTimeSlot => Boolean(s))
    .sort((a, b) => a.index - b.index);

  if (validSlots.length === 0) return [];

  const blocks: ContiguousScheduleBlock[] = [];
  let currentStart = validSlots[0].startTime;
  let currentEnd = validSlots[0].endTime;
  let currentIndex = validSlots[0].index;
  let credits = 1;

  for (let i = 1; i < validSlots.length; i++) {
    const slot = validSlots[i];
    const gapMinutes = toMinutes(slot.startTime) - toMinutes(currentEnd);
    const isConsecutiveInGrade = slot.index === currentIndex + 1 && gapMinutes <= 20;

    if (isConsecutiveInGrade) {
      currentEnd = slot.endTime;
      currentIndex = slot.index;
      credits += 1;
    } else {
      blocks.push({
        startTime: currentStart,
        endTime: currentEnd,
        label: `${currentStart} - ${currentEnd}`,
        credits,
      });
      currentStart = slot.startTime;
      currentEnd = slot.endTime;
      currentIndex = slot.index;
      credits = 1;
    }
  }

  blocks.push({
    startTime: currentStart,
    endTime: currentEnd,
    label: `${currentStart} - ${currentEnd}`,
    credits,
  });

  return blocks;
}

export function formatDaySchedule(dayItem: ScheduleDayInput): string {
  if (dayItem.slots && dayItem.slots.length > 0) {
    return groupContiguousSlots(dayItem.slots)
      .map((b) => b.label)
      .join(", ");
  }
  return "";
}

export function formatPlanScheduleSummary(
  schedule: unknown,
  fallbackIndicacaoHorario?: string | null
): string {
  if (typeof schedule === "string" && schedule.trim()) {
    return schedule.trim();
  }

  if (Array.isArray(schedule)) {
    const typedSchedule = schedule as ScheduleDayInput[];
    const hasAnyExplicitSlots = typedSchedule.some(
      (d) => Array.isArray(d.slots) && d.slots.length > 0
    );

    const formattedDays = typedSchedule
      .filter((d) => d.enabled || (Array.isArray(d.slots) && d.slots.length > 0))
      .map((d) => {
        const times = formatDaySchedule(d);
        return times ? `${d.day}: ${times}` : d.day;
      })
      .filter(Boolean);

    if (hasAnyExplicitSlots && formattedDays.length > 0) {
      return formattedDays.join(" | ");
    }

    if (fallbackIndicacaoHorario?.trim()) {
      return fallbackIndicacaoHorario.trim();
    }

    if (formattedDays.length > 0) {
      return formattedDays.join(" | ");
    }
  }

  return fallbackIndicacaoHorario?.trim() || "Não informado";
}

export function getDaysWithInsufficientCredits(schedule: ScheduleDayInput[]): string[] {
  return schedule
    .filter((d) => d.enabled)
    .filter((d) => (d.slots?.length ?? 0) < 2)
    .map((d) => d.day);
}
