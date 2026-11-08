/** Join class names, skipping falsy values: cx("btn", loading && "is-busy"). */
export function cx(...parts: Array<string | false | null | undefined | 0>): string {
  return parts.filter(Boolean).join(" ");
}
