import { ArrowLeft } from "lucide-react";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
};

export default function BackButton({
  onClick,
  ariaLabel = "Back",
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/10 ${className}`}
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
