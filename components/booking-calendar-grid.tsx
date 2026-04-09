"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { formatBookingStatus, statusBadgeClass } from "@/lib/lab-display";

import type { BookingStatus } from "@prisma/client";

export type CalendarBookingEvent = {
  id: string;
  kind: "lab" | "equipment";
  resourceName: string;
  contextLine: string;
  userName: string;
  /** Why they need the lab or equipment (optional for legacy rows). */
  purpose: string | null;
  start: string;
  end: string;
  status: BookingStatus;
};

/** Visible window (local time): 6am–9pm local; slots outside still appear in lists below. */
const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_PX = 48;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Open the week that contains the user’s reservations if they’re not in the current calendar week. */
export function computeInitialWeekMonday(
  events: { start: string }[],
  now = new Date(),
): Date {
  const curMonday = startOfWeekMonday(now);
  const curSundayEnd = addDays(curMonday, 7);

  const hasInCurrentWeek = events.some((e) => {
    const t = new Date(e.start);
    return t >= curMonday && t < curSundayEnd;
  });
  if (hasInCurrentWeek) return curMonday;

  const futureStarts = events
    .map((e) => new Date(e.start).getTime())
    .filter((t) => t >= now.getTime());
  if (futureStarts.length > 0) {
    return startOfWeekMonday(new Date(Math.min(...futureStarts)));
  }

  if (events.length > 0) {
    const latestPast = Math.max(
      ...events.map((e) => new Date(e.start).getTime()),
    );
    return startOfWeekMonday(new Date(latestPast));
  }

  return curMonday;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatHourLabel(h: number): string {
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}${period}`;
}

function resourceKindLabel(kind: "lab" | "equipment"): string {
  return kind === "lab" ? "Lab" : "Equipment";
}

function formatRangeShort(start: Date, end: Date): string {
  const o: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  };
  return `${start.toLocaleTimeString(undefined, o)}–${end.toLocaleTimeString(undefined, o)}`;
}

function overlapsWeek(start: Date, end: Date, weekStart: Date): boolean {
  const weekEnd = addDays(weekStart, 7);
  return start < weekEnd && end > weekStart;
}

function minutesFromDayStart(d: Date, dayStart: Date): number {
  return (d.getTime() - dayStart.getTime()) / 60000;
}

const POPUP_WIDTH = 288;
const HOVER_SHOW_MS = 280;
const HOVER_HIDE_MS = 140;

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Readable range: one line when same day, two-part when spanning days. */
function formatSmartBookingRange(start: Date, end: Date): string {
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  if (sameCalendarDay(start, end)) {
    const day = start.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${day} · ${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
  }
  const dateTime: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  return `${start.toLocaleString(undefined, dateTime)} → ${end.toLocaleString(undefined, dateTime)}`;
}

type BookingPopupPayload = {
  key: string;
  ev: CalendarBookingEvent;
  clipStart: Date;
  clipEnd: Date;
  anchor: DOMRect;
};

function BookingDetailPopupContent({
  ev,
  clipStart,
  clipEnd,
}: {
  ev: CalendarBookingEvent;
  clipStart: Date;
  clipEnd: Date;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {resourceKindLabel(ev.kind)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(ev.status)}`}
        >
          {formatBookingStatus(ev.status)}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Reserved for
        </p>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {ev.userName}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          When
        </p>
        <p className="text-xs font-medium leading-snug text-slate-800 dark:text-slate-200">
          {formatSmartBookingRange(clipStart, clipEnd)}
        </p>
      </div>
      <div className="border-t border-slate-200 pt-2 dark:border-slate-600">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {resourceKindLabel(ev.kind)}
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {ev.resourceName}
        </p>
        {ev.kind === "equipment" ? (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="text-slate-500 dark:text-slate-500">Lab: </span>
            {ev.contextLine}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {ev.contextLine}
          </p>
        )}
      </div>
      {ev.purpose ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Why
          </p>
          <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {ev.purpose}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function BookingCalendarGrid({ events }: { events: CalendarBookingEvent[] }) {
  const [weekStart, setWeekStart] = useState(() =>
    events.length > 0
      ? computeInitialWeekMonday(events)
      : startOfWeekMonday(new Date()),
  );
  const [view, setView] = useState<"week" | "month">("week");
  const [monthCursor, setMonthCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    const y = weekStart.getFullYear();
    const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
    if (sameMonth) {
      return `${weekStart.toLocaleDateString(undefined, { month: "long", day: "numeric" })} – ${end.getDate()}, ${y}`;
    }
    return `${weekStart.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
  }, [weekStart]);

  const dayLabels = useMemo(() => {
    const days: { key: string; label: string; date: Date }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        date: d,
      });
    }
    return days;
  }, [weekStart]);

  const hours = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR },
        (_, i) => START_HOUR + i,
      ),
    [],
  );

  type Placed = {
    ev: CalendarBookingEvent;
    clipStart: Date;
    clipEnd: Date;
  };

  const eventsByDay = useMemo(() => {
    const map = new Map<number, Placed[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);

    for (const ev of events) {
      const start = new Date(ev.start);
      const end = new Date(ev.end);
      if (!overlapsWeek(start, end, weekStart)) continue;

      for (let i = 0; i < 7; i++) {
        const dayStart = addDays(weekStart, i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = addDays(dayStart, 1);
        if (end <= dayStart || start >= dayEnd) continue;
        const clipStart = start < dayStart ? dayStart : start;
        const clipEnd = end > dayEnd ? dayEnd : end;
        map.get(i)!.push({ ev, clipStart, clipEnd });
      }
    }
    return map;
  }, [events, weekStart]);

  const goPrev = useCallback(() => {
    if (view === "week") setWeekStart((w) => addDays(w, -7));
    else
      setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, [view]);

  const goNext = useCallback(() => {
    if (view === "week") setWeekStart((w) => addDays(w, 7));
    else
      setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, [view]);

  const syncMonthToWeek = useCallback(() => {
    const t = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 15);
    setWeekStart(startOfWeekMonday(t));
  }, [monthCursor]);

  const monthMatrix = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const gridStart = new Date(y, m, 1 - startPad);
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push({ date: d, inMonth: d.getMonth() === m });
    }
    return cells;
  }, [monthCursor]);

  const monthTitle = monthCursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const [bookingPopup, setBookingPopup] = useState<BookingPopupPayload | null>(
    null,
  );
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearShowTimer();
      clearHideTimer();
    },
    [clearHideTimer, clearShowTimer],
  );

  const pointerEnterBooking = useCallback(
    (
      ev: CalendarBookingEvent,
      rangeStart: Date,
      rangeEnd: Date,
      anchorEl: HTMLElement,
    ) => {
      clearHideTimer();
      clearShowTimer();
      const rect = anchorEl.getBoundingClientRect();
      showTimerRef.current = setTimeout(() => {
        setBookingPopup({
          key: `${ev.id}-${rangeStart.getTime()}`,
          ev,
          clipStart: rangeStart,
          clipEnd: rangeEnd,
          anchor: rect,
        });
        showTimerRef.current = null;
      }, HOVER_SHOW_MS);
    },
    [clearHideTimer, clearShowTimer],
  );

  const pointerLeaveBookingOrPopup = useCallback(() => {
    clearShowTimer();
    hideTimerRef.current = setTimeout(() => {
      setBookingPopup(null);
      hideTimerRef.current = null;
    }, HOVER_HIDE_MS);
  }, [clearShowTimer]);

  const pointerEnterPopup = useCallback(() => {
    clearHideTimer();
  }, [clearHideTimer]);

  useLayoutEffect(() => {
    if (!bookingPopup) return;
    const { anchor } = bookingPopup;
    const m = 8;
    const estH = 260;
    let top = anchor.bottom + m;
    if (top + estH > window.innerHeight - m) {
      top = Math.max(m, anchor.top - estH - m);
    }
    let left = anchor.left + anchor.width / 2 - POPUP_WIDTH / 2;
    left = Math.max(m, Math.min(left, window.innerWidth - POPUP_WIDTH - m));
    setPopupPos({ top, left });
  }, [bookingPopup]);

  useEffect(() => {
    const dismissOnScrollOrResize = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setBookingPopup(null);
    };
    window.addEventListener("scroll", dismissOnScrollOrResize, true);
    window.addEventListener("resize", dismissOnScrollOrResize);
    return () => {
      window.removeEventListener("scroll", dismissOnScrollOrResize, true);
      window.removeEventListener("resize", dismissOnScrollOrResize);
    };
  }, []);

  const bookingDetailPortal =
    bookingPopup && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-auto fixed z-[200] w-[288px] max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-xl ring-1 ring-slate-900/5 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/10"
            style={{ top: popupPos.top, left: popupPos.left }}
            onPointerEnter={pointerEnterPopup}
            onPointerLeave={pointerLeaveBookingOrPopup}
          >
            <BookingDetailPopupContent
              ev={bookingPopup.ev}
              clipStart={bookingPopup.clipStart}
              clipEnd={bookingPopup.clipEnd}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Booking Calendar
        </h2>
      </div>

      <div className="flex flex-col flex-wrap gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            &lt; Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Next &gt;
          </button>
          {view === "week" ? (
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Today
            </button>
          ) : null}
        </div>
        <p className="text-center text-sm font-medium text-slate-800 dark:text-slate-100">
          {view === "week" ? weekLabel : monthTitle}
        </p>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
          <button
            type="button"
            onClick={() => {
              setView("week");
              syncMonthToWeek();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              view === "week"
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              view === "month"
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {view === "week" ? (
        <div className="overflow-x-auto p-4">
          <div
            className="grid min-w-[720px] gap-0"
            style={{
              gridTemplateColumns: `3.5rem repeat(7, minmax(0, 1fr))`,
            }}
          >
            <div />
            {dayLabels.map(({ key, label, date }) => (
              <div
                key={key}
                className="border-b border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                <span className="block">{label}</span>
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
              </div>
            ))}

            <div
              className="relative border-r border-slate-200 dark:border-slate-700"
              style={{ height: hours.length * HOUR_PX }}
            >
              {hours.map((h, idx) => (
                <div
                  key={h}
                  className="absolute right-1 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400"
                  style={{ top: idx * HOUR_PX - 6, height: HOUR_PX }}
                >
                  {formatHourLabel(h)}
                </div>
              ))}
            </div>

            {dayLabels.map(({ key }, dayIndex) => {
              const dayStart = addDays(weekStart, dayIndex);
              dayStart.setHours(0, 0, 0, 0);
              const placed = eventsByDay.get(dayIndex) ?? [];
              const windowStart = new Date(dayStart);
              windowStart.setHours(START_HOUR, 0, 0, 0);
              const windowEnd = new Date(dayStart);
              windowEnd.setHours(END_HOUR, 0, 0, 0);

              return (
                <div
                  key={`col-${key}`}
                  className="relative border-r border-slate-200 dark:border-slate-700"
                  style={{ height: hours.length * HOUR_PX }}
                >
                  {placed.length === 0 ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        No bookings
                      </span>
                    </div>
                  ) : null}
                  {hours.map((h, idx) => {
                    const hourStart = new Date(dayStart);
                    hourStart.setHours(h, 0, 0, 0);
                    const hourEnd = new Date(dayStart);
                    hourEnd.setHours(h + 1, 0, 0, 0);
                    const hasOverlap = placed.some(
                      ({ clipStart, clipEnd }) =>
                        clipEnd > hourStart && clipStart < hourEnd,
                    );
                    return (
                      <div
                        key={h}
                        className="absolute inset-x-0 border-b border-slate-100 dark:border-slate-800"
                        style={{
                          top: idx * HOUR_PX,
                          height: HOUR_PX,
                        }}
                      >
                        <div className="flex h-full items-start justify-center pt-1">
                          {placed.length > 0 && !hasOverlap ? (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              No bookings
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {placed.map(({ ev, clipStart, clipEnd }) => {
                    const clipS =
                      clipStart < windowStart ? windowStart : clipStart;
                    const clipE = clipEnd > windowEnd ? windowEnd : clipEnd;
                    if (clipE <= clipS) return null;
                    const startM = minutesFromDayStart(clipS, windowStart);
                    const endM = minutesFromDayStart(clipE, windowStart);
                    if (endM <= 0 || startM >= TOTAL_MINUTES) return null;
                    const top =
                      (Math.max(0, startM) / TOTAL_MINUTES) *
                      (hours.length * HOUR_PX);
                    const height =
                      ((Math.min(TOTAL_MINUTES, endM) -
                        Math.max(0, startM)) /
                        TOTAL_MINUTES) *
                      (hours.length * HOUR_PX);
                    const minH = 36;
                    return (
                      <div
                        key={`${ev.id}-${dayIndex}-${clipS.getTime()}`}
                        className="absolute left-1 right-1 z-20 cursor-default overflow-hidden rounded-lg border border-sky-200/80 bg-sky-50/95 px-2 py-1.5 text-left shadow-sm dark:border-sky-900/50 dark:bg-sky-950/50"
                        style={{
                          top: Math.max(0, top),
                          height: Math.max(minH, height),
                          minHeight: minH,
                        }}
                        onPointerEnter={(e) =>
                          pointerEnterBooking(ev, clipS, clipE, e.currentTarget)
                        }
                        onPointerLeave={pointerLeaveBookingOrPopup}
                      >
                        <p className="text-xs leading-tight text-sky-900 dark:text-sky-100">
                          <span className="block text-[9px] font-medium uppercase tracking-wide text-sky-700/85 dark:text-sky-300/85">
                            Reserved for
                          </span>
                          <span className="font-bold">{ev.userName}</span>
                        </p>
                        <p className="text-[10px] font-medium text-sky-800/90 dark:text-sky-200/90">
                          {formatRangeShort(clipS, clipE)}
                        </p>
                        <p className="truncate text-[10px] text-slate-600 dark:text-slate-400">
                          <span className="text-slate-500 dark:text-slate-500">
                            {resourceKindLabel(ev.kind)}:{" "}
                          </span>
                          {ev.resourceName}
                        </p>
                        <p className="truncate text-[9px] text-slate-500 dark:text-slate-500">
                          {ev.kind === "equipment" ? (
                            <>
                              <span className="text-slate-400 dark:text-slate-600">
                                Location:{" "}
                              </span>
                              {ev.contextLine}
                            </>
                          ) : (
                            ev.contextLine
                          )}
                        </p>
                        {ev.purpose ? (
                          <p
                            className="line-clamp-2 text-[9px] text-slate-600 dark:text-slate-400"
                          >
                            <span className="font-medium text-slate-500 dark:text-slate-500">
                              Why:{" "}
                            </span>
                            {ev.purpose}
                          </p>
                        ) : null}
                        <span
                          className={`mt-0.5 inline-block rounded-full px-1.5 py-0 text-[9px] font-semibold ${statusBadgeClass(ev.status)}`}
                        >
                          {formatBookingStatus(ev.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Grid shows {formatHourLabel(START_HOUR)}–{formatHourLabel(END_HOUR)}{" "}
            (your local time). Slots outside that window still appear in the
            reservation lists below.
          </p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-800">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="bg-slate-50 py-2 text-center text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400"
              >
                {d}
              </div>
            ))}
            {monthMatrix.map(({ date, inMonth }, i) => {
              const dayStart = new Date(date);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = addDays(dayStart, 1);
              const dayEv = events.filter((ev) => {
                const s = new Date(ev.start);
                const e = new Date(ev.end);
                return s < dayEnd && e > dayStart;
              });
              return (
                <div
                  key={i}
                  className={`min-h-[5.5rem] bg-white p-1 dark:bg-slate-900/80 ${
                    inMonth ? "" : "opacity-40"
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold ${
                      inMonth
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <ul className="mt-0.5 space-y-0.5">
                    {dayEv.slice(0, 2).map((ev) => (
                      <li
                        key={ev.id + String(date.getTime())}
                        className="cursor-default truncate rounded bg-sky-100/90 px-1 py-0.5 text-[9px] font-medium text-sky-900 dark:bg-sky-950/60 dark:text-sky-200"
                        onPointerEnter={(e) =>
                          pointerEnterBooking(
                            ev,
                            new Date(ev.start),
                            new Date(ev.end),
                            e.currentTarget,
                          )
                        }
                        onPointerLeave={pointerLeaveBookingOrPopup}
                      >
                        <span className="text-sky-700/80 dark:text-sky-400/80">
                          {ev.userName.split(" ")[0]}
                        </span>{" "}
                        {new Date(ev.start).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </li>
                    ))}
                    {dayEv.length > 2 ? (
                      <li className="text-[9px] text-slate-500">
                        +{dayEv.length - 2} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {bookingDetailPortal}
    </div>
  );
}
