import { IconButton } from "./IconButton";
import { Logo } from "./Logo";

export type FocusedBarProps = {
  /** Where the close button goes. Pass the validated ?next= on log in and sign up. Default "/". */
  closeHref?: string;
  /** Accessible name of the close button. */
  closeLabel?: string;
};

/**
 * Focused-flow bar (DESIGN.md 5.8) for /login, /signup and the error page:
 * 72 px, hairline bottom, logo left, 40 px close button right. Render it in a
 * <header> above <main id="content">, then put the form in <div className="focused-col">.
 */
export function FocusedBar({ closeHref = "/", closeLabel = "Close and go back" }: FocusedBarProps) {
  return (
    <header className="focused-bar">
      <div className="focused-bar-inner">
        <Logo />
        <IconButton href={closeHref} icon="close" label={closeLabel} />
      </div>
    </header>
  );
}
