"use client";

import { ArrowRight, Check, CircleCheck, CircleExclamationPoint } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { saveScheduleAction, type ScheduleState } from "@/app/actions/schedule";
import {
  type Availability,
  type DayPlan,
  formatMinutes,
  MAX_SESSIONS,
  MINUTE_OPTIONS,
  plannedSlots,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  WEEKDAYS,
  type WeekdayKey,
  weeklyMinutes,
} from "@/lib/availability";
import { formatFullDate, isISODate } from "@/lib/dates";

export type ScheduleFormProps = {
  initial: Availability;
  /** The date shown in the field: the student's own, else the class date. */
  examDate: string;
  classExamDate: string;
  supplementary: boolean;
  supplementaryTitles: string[];
  today: string;
};

const SESSION_OPTIONS = Array.from({ length: MAX_SESSIONS }, (_, i) => i + 1);

function mostCommon(plans: DayPlan[]): DayPlan {
  const counts = new Map<string, { plan: DayPlan; n: number }>();
  for (const p of plans) {
    const k = `${p.sessions}x${p.minutes}`;
    counts.set(k, { plan: p, n: (counts.get(k)?.n ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n)[0]?.plan ?? { sessions: 1, minutes: 30 };
}

export function ScheduleForm(props: ScheduleFormProps) {
  const [state, action, pending] = useActionState<ScheduleState, FormData>(saveScheduleAction, {});
  const initialPlans = WEEKDAYS.flatMap((k) => (props.initial.days[k] ? [props.initial.days[k]!] : []));
  const [days, setDays] = useState<Set<WeekdayKey>>(() => new Set(WEEKDAYS.filter((k) => props.initial.days[k])));
  const [common, setCommon] = useState<DayPlan>(() => mostCommon(initialPlans));
  const [vary, setVary] = useState(() => initialPlans.some((p) => p.sessions !== initialPlans[0].sessions || p.minutes !== initialPlans[0].minutes));
  const [perDay, setPerDay] = useState<Record<WeekdayKey, DayPlan>>(() => {
    const base = mostCommon(initialPlans);
    return Object.fromEntries(WEEKDAYS.map((k) => [k, props.initial.days[k] ?? base])) as Record<WeekdayKey, DayPlan>;
  });
  const [examDate, setExamDate] = useState(props.examDate);

  const availability: Availability = useMemo(
    () => ({ v: 1, days: Object.fromEntries(WEEKDAYS.filter((k) => days.has(k)).map((k) => [k, vary ? perDay[k] : common])) }),
    [days, vary, perDay, common],
  );
  const weekly = weeklyMinutes(availability);
  const examOk = isISODate(examDate) && examDate > props.today;
  const slots = examOk ? plannedSlots(availability, props.today, examDate) : [];
  const slotMinutes = slots.reduce((m, s) => m + s.minutes, 0);
  const daysError = state.field === "days";
  const dateError = state.field === "examDate";

  function toggleDay(k: WeekdayKey) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  return (
    <form action={action} className="stack-lg" noValidate>
      <input type="hidden" name="availability" value={JSON.stringify(availability)} />
      {state.error && !state.field ? (
        <div className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state.saved && !pending ? (
        <div className="alert alert-success" role="status">
          <CircleCheck size={18} aria-hidden="true" />
          <span>Schedule saved. Your plan now fits this time.</span>
        </div>
      ) : null}

      <section className="card stack" aria-labelledby="when-title">
        <div>
          <h2 id="when-title" className="card-title" style={{ marginBottom: 4 }}>
            When can you study?
          </h2>
          <p className="small text-2">Pick the days you can usually study. You can change this any time.</p>
        </div>

        <fieldset aria-describedby={daysError ? "days-error" : undefined} aria-invalid={daysError || undefined}>
          <legend className="label" style={{ marginBottom: 8 }}>
            Study days
          </legend>
          <div className="day-chips">
            {WEEKDAYS.map((k) => (
              <label key={k} className="day-chip">
                <input id={`day-${k}`} type="checkbox" checked={days.has(k)} onChange={() => toggleDay(k)} aria-label={WEEKDAY_LONG[k]} />
                <span aria-hidden="true">{WEEKDAY_SHORT[k]}</span>
              </label>
            ))}
          </div>
          {daysError ? (
            <p id="days-error" className="field-error" style={{ marginTop: 8 }}>
              <CircleExclamationPoint size={16} aria-hidden="true" />
              {state.error}
            </p>
          ) : null}
        </fieldset>

        {!vary ? (
          <div className="schedule-grid">
            <div className="field">
              <label className="label" htmlFor="sessions">
                Sessions a day
              </label>
              <select id="sessions" className="select" value={common.sessions} onChange={(e) => setCommon({ ...common, sessions: Number(e.target.value) })}>
                {SESSION_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="minutes">
                Minutes each
              </label>
              <select id="minutes" className="select" value={common.minutes} onChange={(e) => setCommon({ ...common, minutes: Number(e.target.value) })}>
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatMinutes(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <label className="checkbox">
          <input id="vary" type="checkbox" checked={vary} onChange={(e) => setVary(e.target.checked)} />
          <span>Different on some days</span>
        </label>

        {vary ? (
          days.size === 0 ? (
            <p className="small muted">Choose your study days first.</p>
          ) : (
            <div className="day-table-wrap">
              <table className="table day-table">
                <caption className="sr-only">Sessions and minutes for each study day</caption>
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Sessions</th>
                    <th scope="col">Minutes each</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKDAYS.filter((k) => days.has(k)).map((k) => (
                    <tr key={k}>
                      <th scope="row">{WEEKDAY_LONG[k]}</th>
                      <td>
                        <select
                          id={`sessions-${k}`}
                          className="select"
                          aria-label={`Sessions on ${WEEKDAY_LONG[k]}`}
                          value={perDay[k].sessions}
                          onChange={(e) => setPerDay({ ...perDay, [k]: { ...perDay[k], sessions: Number(e.target.value) } })}
                        >
                          {SESSION_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          id={`minutes-${k}`}
                          className="select"
                          aria-label={`Minutes per session on ${WEEKDAY_LONG[k]}`}
                          value={perDay[k].minutes}
                          onChange={(e) => setPerDay({ ...perDay, [k]: { ...perDay[k], minutes: Number(e.target.value) } })}
                        >
                          {MINUTE_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {formatMinutes(m)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        <div className="schedule-total" aria-live="polite">
          <Check size={18} aria-hidden="true" />
          <p>
            {days.size === 0 ? (
              "No study days chosen yet."
            ) : (
              <>
                <strong className="num">{formatMinutes(weekly)}</strong> a week
                {examOk ? (
                  <>
                    {" "}
                    · <span className="num">{slots.length}</span> session{slots.length === 1 ? "" : "s"} (about{" "}
                    <span className="num">{formatMinutes(slotMinutes)}</span>) before the exam
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>
      </section>

      <section className="card stack" aria-labelledby="exam-title">
        <h2 id="exam-title" className="card-title" style={{ marginBottom: 0 }}>
          Exam date
        </h2>
        <div className="field">
          <label className="label" htmlFor="examDate">
            Date of your exam
          </label>
          <input
            id="examDate"
            name="examDate"
            type="date"
            className="input"
            style={{ maxWidth: 280 }}
            value={examDate}
            min={props.today}
            onChange={(e) => setExamDate(e.target.value)}
            aria-invalid={dateError || undefined}
            aria-describedby={dateError ? "exam-error exam-hint" : "exam-hint"}
          />
          {dateError ? (
            <p id="exam-error" className="field-error">
              <CircleExclamationPoint size={16} aria-hidden="true" />
              {state.error}
            </p>
          ) : null}
          <p id="exam-hint" className="field-hint">
            Your class&apos;s date is {formatFullDate(props.classExamDate)}. Change it only if you take the exam on another day, like a make-up.
          </p>
        </div>
        {examDate !== props.classExamDate ? (
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExamDate(props.classExamDate)}>
              Use the class date
            </button>
          </div>
        ) : null}
      </section>

      <section className="card stack" aria-labelledby="extra-title">
        <h2 id="extra-title" className="card-title" style={{ marginBottom: 0 }}>
          Extra sections
        </h2>
        <label className="checkbox">
          <input id="supplementary" type="checkbox" name="supplementary" defaultChecked={props.supplementary} aria-describedby="extra-hint" />
          <span>
            Include {props.supplementaryTitles.join(" and ")}
          </span>
        </label>
        <p id="extra-hint" className="field-hint" style={{ marginTop: -8 }}>
          Not on Exam 4. When they have problems, they appear only as optional extra practice and never count toward your exam progress.
        </p>
      </section>

      <div className="form-actions">
        <button className="btn btn-primary btn-lg" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save schedule"}
          {pending ? null : <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
