import "./Beacon.css";

type Props = {
  onClick?: () => void;
  label?: string;
};

export default function Beacon({ onClick, label = "Open tour" }: Props) {
  return (
    <button
      type="button"
      className="beacon-button"
      aria-label={label}
      onClick={onClick}
    >
      <span className="beacon-dot" aria-hidden />
    </button>
  );
}
