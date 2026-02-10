import fanIcon from "../assets/FanIcon.svg";
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
      <img src={fanIcon} alt="" className="beacon-icon" aria-hidden />
    </button>
  );
}
