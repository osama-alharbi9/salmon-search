"use client";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Button } from "./Button";
import { cx } from "./cx";
import { Icon } from "./Icon";

type FieldBase = {
  /** Visible label (14/20 600). Required: placeholders are examples, never the label. */
  label: ReactNode;
  /** Adds a grey "(optional)" after the label. */
  optional?: boolean;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  /** Help line under the field (14/20 secondary). Hidden while an error shows. */
  help?: ReactNode;
  /** Error message. Sets aria-invalid and points aria-describedby at it. */
  error?: ReactNode;
  /** Shows "{length} of {maxLength} characters" under the field (needs value + maxLength). */
  counter?: boolean;
  /** Extra content under the field, e.g. a <RulePanel> for the sign-up password. */
  after?: ReactNode;
  /** Class for the outer .field wrapper. */
  className?: string;
};

export type TextFieldProps = FieldBase &
  Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
    multiline?: false;
    ref?: Ref<HTMLInputElement>;
  };

export type TextAreaFieldProps = FieldBase &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> & {
    multiline: true;
    ref?: Ref<HTMLTextAreaElement>;
  };

function describedBy(...ids: Array<string | false | undefined>) {
  const v = ids.filter(Boolean).join(" ");
  return v || undefined;
}

/**
 * Label, 48 px field, help or error line (DESIGN.md 5.2). type="password" adds
 * the Show/Hide pill. `multiline` renders the vibe textarea.
 */
export function TextField(props: TextFieldProps | TextAreaFieldProps) {
  const autoId = useId();
  const [reveal, setReveal] = useState(false);
  const {
    label,
    optional,
    hideLabel,
    help,
    error,
    counter,
    after,
    className,
    id = autoId,
  } = props;
  const helpId = help && !error ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const counterId = counter ? `${id}-count` : undefined;
  const maxLength = props.maxLength;
  const len = typeof props.value === "string" ? props.value.length : undefined;

  let control: ReactNode;
  if (props.multiline) {
    const {
      label: _l, optional: _o, hideLabel: _hl, help: _h, error: _e, counter: _c, after: _a,
      className: _cn, multiline: _m, id: _id, ...rest
    } = props;
    void [_l, _o, _hl, _h, _e, _c, _a, _cn, _m, _id];
    control = (
      <textarea
        {...rest}
        id={id}
        className="input"
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={describedBy(rest["aria-describedby"], errorId, helpId, counterId)}
      />
    );
  } else {
    const {
      label: _l, optional: _o, hideLabel: _hl, help: _h, error: _e, counter: _c, after: _a,
      className: _cn, multiline: _m, id: _id, type = "text", ...rest
    } = props;
    void [_l, _o, _hl, _h, _e, _c, _a, _cn, _m, _id];
    const isPassword = type === "password";
    const input = (
      <input
        {...rest}
        id={id}
        type={isPassword && reveal ? "text" : type}
        className="input"
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={describedBy(rest["aria-describedby"], errorId, helpId, counterId)}
      />
    );
    control = isPassword ? (
      <div className="input-wrap">
        {input}
        <Button
          variant="neutral"
          size="s"
          className="input-action"
          aria-pressed={reveal}
          aria-controls={id}
          onClick={() => setReveal((r) => !r)}
          disabled={rest.disabled}
        >
          {reveal ? "Hide" : "Show"}
          <span className="visually-hidden"> password</span>
        </Button>
      </div>
    ) : (
      input
    );
  }

  return (
    <div className={cx("field", className)}>
      <label htmlFor={id} className={cx("field-label", hideLabel && "visually-hidden")}>
        {label}
        {optional && <span className="opt"> (optional)</span>}
      </label>
      {control}
      {after}
      {error ? (
        <span className="field-error" id={errorId}>
          <Icon name="info" size={16} />
          <span>{error}</span>
        </span>
      ) : help ? (
        <span className="help" id={helpId}>
          {help}
        </span>
      ) : null}
      {counter && maxLength !== undefined && len !== undefined && (
        <span className="counter" id={counterId}>
          {len} of {maxLength} characters
        </span>
      )}
    </div>
  );
}

export type Rule = { label: string; state: "neutral" | "pass" | "fail" };

/**
 * Password rule panel under a field (DESIGN.md 5.2): neutral before input,
 * green when passed, red after a failed submit. Announced politely.
 * Pass its id in the field's aria-describedby if it explains the rule.
 */
export function RulePanel({ rules, id }: { rules: Rule[]; id?: string }) {
  return (
    <div className="rules" aria-live="polite" id={id}>
      {rules.map((r) => (
        <div className="rule" data-state={r.state} key={r.label}>
          <span className="rule-disc" aria-hidden="true">
            {r.state === "pass" && <Icon name="check" size={16} />}
            {r.state === "fail" && <Icon name="close" size={16} />}
          </span>
          <span>
            {r.label}
            {r.state === "pass" && <span className="visually-hidden">, done</span>}
            {r.state === "fail" && <span className="visually-hidden">, not met</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
