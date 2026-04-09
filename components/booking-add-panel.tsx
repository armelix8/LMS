"use client";

import { useEffect, useState } from "react";

export type BookingAddTab = "lab" | "equipment";

export function BookingAddPanel({
  initialTab = "lab",
  labForm,
  equipmentForm,
}: {
  initialTab?: BookingAddTab;
  labForm: React.ReactNode;
  equipmentForm: React.ReactNode;
}) {
  const [tab, setTab] = useState<BookingAddTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 lg:sticky lg:top-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        Add reservation
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Choose lab space or a specific equipment item, then pick times and
        describe why you need it.
      </p>
      <div className="mt-4 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-600">
        <button
          type="button"
          onClick={() => setTab("lab")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
            tab === "lab"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Lab
        </button>
        <button
          type="button"
          onClick={() => setTab("equipment")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
            tab === "equipment"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Equipment
        </button>
      </div>
      <div className="mt-4">
        <div className={tab === "lab" ? "block" : "hidden"}>{labForm}</div>
        <div className={tab === "equipment" ? "block" : "hidden"}>
          {equipmentForm}
        </div>
      </div>
    </div>
  );
}
