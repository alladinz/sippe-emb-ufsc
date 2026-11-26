"use client";

import React from "react";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  UFSC_TIME_SLOTS,
  groupContiguousSlots,
  formatPlanScheduleSummary,
  type ScheduleDayInput,
} from "@/lib/schedule/ufsc-schedule";

interface ClassSchedulePickerProps {
  value: ScheduleDayInput[];
  onChange: (nextValue: ScheduleDayInput[]) => void;
  disabled?: boolean;
  fallbackIndicacaoHorario?: string | null;
}

const MORNING_SLOTS = UFSC_TIME_SLOTS.filter((s) => s.period === "Manhã");
const AFTERNOON_EVENING_SLOTS = UFSC_TIME_SLOTS.filter(
  (s) => s.period === "Tarde" || s.period === "Noite"
);

export function ClassSchedulePicker({
  value,
  onChange,
  disabled = false,
  fallbackIndicacaoHorario,
}: ClassSchedulePickerProps) {
  const summary = formatPlanScheduleSummary(value, fallbackIndicacaoHorario);
  const hasAnySelectedSlot = value.some((d) => (d.slots?.length ?? 0) > 0);
  const enabledDays = value.filter((d) => d.enabled);

  const toggleDay = (dayName: string, checked: boolean) => {
    const next = value.map((item) => {
      if (item.day !== dayName) return item;
      return {
        ...item,
        enabled: checked,
        slots: checked ? item.slots ?? [] : [],
      };
    });
    onChange(next);
  };

  const toggleSlot = (dayName: string, slotId: string) => {
    const next = value.map((item) => {
      if (item.day !== dayName) return item;
      const current = item.slots ?? [];
      const exists = current.includes(slotId);
      const updatedSlots = exists
        ? current.filter((s) => s !== slotId)
        : [...current, slotId];

      // Sort by official UFSC grid order
      updatedSlots.sort((a, b) => {
        const idxA = UFSC_TIME_SLOTS.findIndex((s) => s.id === a);
        const idxB = UFSC_TIME_SLOTS.findIndex((s) => s.id === b);
        return idxA - idxB;
      });

      const blocks = groupContiguousSlots(updatedSlots);
      return {
        ...item,
        enabled: true,
        slots: updatedSlots,
        startTime: blocks[0]?.startTime || item.startTime || "08:40",
        endTime:
          blocks[blocks.length - 1]?.endTime || item.endTime || "10:20",
      };
    });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Live Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70">
        <div className="flex items-start gap-2.5 min-w-0">
          <Clock className="w-4 h-4 text-[#023E8A] shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Horário da Aula (Prévia para o documento)
            </p>
            <p className="text-xs font-bold text-[#102E52] break-words">
              {hasAnySelectedSlot ? summary : "Nenhum horário selecionado na grade."}
            </p>
            {!hasAnySelectedSlot && fallbackIndicacaoHorario && (
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                Indicação importada da planilha: <span className="font-mono">{fallbackIndicacaoHorario}</span> — confirme os dias e horários na grade abaixo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Day Toggles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#023E8A]" />
            Dias da semana com aula:
          </span>
          <span className="text-[11px] text-slate-500">
            Mínimo de 2 créditos seguidos por dia
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {value.map((dayItem, idx) => {
            const isChecked = !!dayItem.enabled;
            const slotCount = dayItem.slots?.length ?? 0;
            return (
              <label
                key={dayItem.day}
                htmlFor={`id-schedule-day-${idx}`}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all select-none",
                  disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer",
                  isChecked
                    ? "border-[#023E8A] bg-blue-50/90 text-[#023E8A] font-bold shadow-2xs ring-1 ring-[#023E8A]/40"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    id={`id-schedule-day-${idx}`}
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={(checked) => toggleDay(dayItem.day, !!checked)}
                    className="data-[state=checked]:bg-[#023E8A] data-[state=checked]:border-[#023E8A]"
                  />
                  <span className="text-xs truncate">{dayItem.day}</span>
                </div>
                {isChecked && slotCount > 0 && (
                  <span className="text-[10px] font-bold bg-[#023E8A] text-white px-1.5 py-0.5 rounded-full shrink-0">
                    {slotCount}c
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Time Slot Grid per Enabled Day */}
      {enabledDays.length > 0 && (
        <div className="space-y-3">
          {enabledDays.map((dayItem) => {
            const selectedSlots = dayItem.slots ?? [];
            const blocks = groupContiguousSlots(selectedSlots);
            const hasInsufficient = selectedSlots.length < 2;

            return (
              <div
                key={dayItem.day}
                className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#102E52]">
                      {dayItem.day}
                    </span>
                    {blocks.length > 0 && (
                      <span className="text-xs font-bold text-[#023E8A] bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full">
                        {blocks.map((b) => b.label).join(" e ")}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {selectedSlots.length} {selectedSlots.length === 1 ? "crédito selecionado" : "créditos selecionados"}
                  </span>
                </div>

                {hasInsufficient && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/70 px-3 py-1.5 rounded-lg font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Selecione ao menos 2 créditos seguidos na grade (ex.: 08:40 - 09:30 e 09:30 - 10:20).
                    </span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Manhã
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {MORNING_SLOTS.map((slot) => {
                        const active = selectedSlots.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleSlot(dayItem.day, slot.id)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-xs font-semibold tabular-nums transition-all",
                              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                              active
                                ? "bg-[#023E8A] text-white border-[#023E8A] shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {slot.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tarde / Noite
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {AFTERNOON_EVENING_SLOTS.map((slot) => {
                        const active = selectedSlots.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleSlot(dayItem.day, slot.id)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-xs font-semibold tabular-nums transition-all",
                              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                              active
                                ? "bg-[#023E8A] text-white border-[#023E8A] shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            {slot.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
