"use client";

import { useId, useRef, useState } from "react";

/**
 * A button that asks for confirmation in a modal dialog before submitting its enclosing form.
 * With `typeToConfirm`, the confirm button stays disabled until the word is typed (sent as "confirm").
 */
export function ConfirmSubmit({
  label,
  title,
  body,
  confirmLabel,
  typeToConfirm,
  buttonClass = "btn btn-danger",
}: {
  label: React.ReactNode;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  typeToConfirm?: string;
  buttonClass?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const ready = !typeToConfirm || typed === typeToConfirm;
  return (
    <>
      <button ref={trigger} type="button" className={buttonClass} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog ref={ref} className="sheet" aria-labelledby={titleId} style={{ width: "min(480px, calc(100vw - 24px))" }} onClose={() => trigger.current?.focus()}>
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
        </div>
        <div className="sheet-body stack">
          <div className="small text-2">{body}</div>
          {typeToConfirm ? (
            <div className="field">
              <label className="label" htmlFor={`${titleId}-confirm`}>
                Type {typeToConfirm} to confirm
              </label>
              <input id={`${titleId}-confirm`} name="confirm" className="input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
          ) : null}
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn btn-secondary" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={!ready}>
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
