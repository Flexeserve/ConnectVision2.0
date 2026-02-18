import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Header from "../components/Header";
import storeIcon from "../assets/storeIcon.svg";
import "./StoreViewPage.css";

type StoreViewPageProps = {
  onBack?: () => void;
  title?: string;
  rows?: Array<{ id: string; title: string }>;
  onOpen?: (id: string) => void;
};

const STORE_DEVICE_ROWS = [
  {
    id: "left-flexeserve",
    device: "Flexeserve - LEFT",
    model: "Flexeserve 2T 1000",
    schedule: "Flexeserve 2 - Standard",
    statusDots: 2,
  },
  {
    id: "right-flexeserve",
    device: "Flexeserve - RIGHT*",
    model: "Flexeserve 2T 1000",
    schedule: "Flexeserve 1 - Standard",
    statusDots: 2,
  },
  {
    id: "pizza-spinner",
    device: "Pizza Spinner",
    model: "Pizza Spinner",
    schedule: "Pizza Spinner - Standard",
    statusDots: 1,
  },
  {
    id: "roller-grill",
    device: "Roller Grill",
    model: "Roller Grill",
    schedule: "Roller Grill - Standard",
    statusDots: 1,
  },
];

export default function StoreViewPage({
  onBack,
  title,
  rows = [],
  onOpen,
}: StoreViewPageProps) {
  return (
    <div className="store-view-page">
      <Header onBack={onBack} title={title ?? "Store View"} />

      <div className="store-view-container">
        <div className="greetings">Good Morning</div>

        <div className="store-view-main">
          <div className="store-view-left">
            <Container maxWidth="lg" sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Box
                  component="img"
                  src={storeIcon}
                  alt="Store Icon"
                  className="store-icon"
                  sx={{ height: 64 }}
                />
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {title ?? "View All Markets"}
                </Typography>
              </Box>
              {rows.length > 0 && (
                <Box className="store-list">
                  {rows.map((row) => (
                    <Box
                      key={row.id}
                      className="store-row"
                      onClick={() => onOpen?.(row.id)}
                      role={onOpen ? "button" : undefined}
                      tabIndex={onOpen ? 0 : -1}
                      onKeyDown={(event) => {
                        if (!onOpen) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpen(row.id);
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontSize: "0.98rem",
                        }}
                      >
                        {row.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Container>
          </div>

          <div className="store-view-right">
            <Box className="greetings-search">
              <TextField
                variant="outlined"
                size="small"
                placeholder="Write to start search"
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      sx={{
                        m: 0,
                        height: "100%",
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: "center",
                        color: "var(--text-primary)",
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Search"
                        className="search-button"
                      >
                        <SearchIcon fontSize="small" sx={{ color: "#fff" }} />
                      </button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: "100%", sm: 360, md: 460 },
                  maxWidth: { xs: "100%", sm: 420, md: 500 },
                  "& .MuiInputBase-root": {
                    color: "var(--text-primary)",
                    backgroundColor: "var(--panel-bg)",
                    paddingRight: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "var(--text-muted)",
                    opacity: 1,
                  },
                  "& .MuiOutlinedInput-root": {
                    paddingRight: 0,
                    height: 36,
                  },
                  "& .MuiOutlinedInput-input": {
                    paddingTop: 0,
                    paddingBottom: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                  },
                  "& .MuiInputAdornment-positionEnd": {
                    marginRight: 0,
                    height: "100%",
                    alignSelf: "stretch",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--border-strong)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--text-primary)",
                  },
                }}
              />
            </Box>
          </div>
        </div>
        <div className="store-view-bottom">
          <Container maxWidth={false} className="store-device-container">
            <div className="store-device-header">
              <span>Device</span>
              <span>Model</span>
              <span>Schedule</span>
              <span>Status</span>
            </div>
            <div className="store-device-list">
              {STORE_DEVICE_ROWS.map((row) => (
                <div className="store-device-row" key={row.id}>
                  <span className="store-device-cell">{row.device}</span>
                  <span className="store-device-cell">{row.model}</span>
                  <div className="store-device-cell">
                    <select
                      defaultValue={row.schedule}
                      className="store-device-select"
                    >
                      <option>{row.schedule}</option>
                      <option>{row.model} - Weekend</option>
                      <option>{row.model} - Off-Peak</option>
                    </select>
                  </div>
                  <div className="store-device-status">
                    {Array.from({ length: row.statusDots }).map((_, index) => (
                      <span
                        key={`${row.id}-status-${index}`}
                        className="store-status-dot"
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
