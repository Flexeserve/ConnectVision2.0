import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Props = {
  onClick?: () => void;
  ariaLabel?: string;
  color?: string;
};

export default function BackButton({
  onClick,
  ariaLabel = "Back",
  color = "#333333",
}: Props) {
  return (
    <IconButton
      sx={{ color }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <ArrowBackIcon />
    </IconButton>
  );
}
