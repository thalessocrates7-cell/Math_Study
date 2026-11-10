import { describe, expect, it } from "vitest";
import { chooseStudyCard, type StudyCardInput } from "@/lib/study-card";

const base: StudyCardInput = {
  open: null,
  plan: { problemIds: ["4.10-470", "4.10-476"], minutes: 30, scheduled: true },
  doneToday: false,
  due: null,
};

describe("the Dashboard's study card", () => {
  it("starts today's session with its first problem", () => {
    expect(chooseStudyCard(base)).toEqual({ kind: "start", problemId: "4.10-470", total: 2, minutes: 30 });
  });

  it("still starts a session on a day the schedule leaves free (the student can just start)", () => {
    const card = chooseStudyCard({ ...base, plan: { ...base.plan, scheduled: false } });
    expect(card).toMatchObject({ kind: "start", minutes: 30 });
  });

  it("continues the open session at its next problem", () => {
    const open = { next: { problemId: "4.10-476", href: "/practice/4.10-476?s=x", track: "core", essential: true }, index: 2, total: 5 };
    expect(chooseStudyCard({ ...base, open })).toEqual({
      kind: "continue",
      problemId: "4.10-476",
      href: "/practice/4.10-476?s=x",
      index: 2,
      total: 5,
      easier: false,
    });
  });

  it("calls out an easier problem, and an optional extra has no place number", () => {
    const easier = { next: { problemId: "4.10-490", href: "/practice/4.10-490?s=y", track: "reinforcement", essential: true }, index: 3, total: 5 };
    expect(chooseStudyCard({ ...base, open: easier })).toMatchObject({ kind: "continue", easier: true, index: 3 });
    const extra = { next: { problemId: "4.10-495", href: "/practice/4.10-495?s=z", track: "extra", essential: false }, index: null, total: 5 };
    expect(chooseStudyCard({ ...base, open: extra })).toMatchObject({ kind: "continue", index: null });
  });

  it("sends an open session with nothing left to the session page", () => {
    expect(chooseStudyCard({ ...base, open: { next: null, index: null, total: 4 } })).toMatchObject({ kind: "continue", href: "/session" });
  });

  it("after today's session, offers the next one only when the schedule plans it", () => {
    expect(chooseStudyCard({ ...base, doneToday: true })).toMatchObject({ kind: "start" });
    expect(chooseStudyCard({ ...base, doneToday: true, plan: { ...base.plan, scheduled: false } })).toEqual({ kind: "done-today" });
  });

  it("with nothing left to plan, points to due reviews, else says all caught up", () => {
    const empty = { ...base, plan: { problemIds: [], minutes: 30, scheduled: true } };
    const due = { problemId: "5.1-8", href: "/practice/5.1-8?item=r1", count: 2 };
    expect(chooseStudyCard({ ...empty, due })).toEqual({ kind: "review", ...due });
    expect(chooseStudyCard(empty)).toEqual({ kind: "caught-up" });
  });
});
