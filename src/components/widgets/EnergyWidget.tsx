import { Box, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./EnergyWidget.css";

const hours = ["00", "04", "08", "12", "16", "20", "24"];
const avgTemp = [3.1, 3.4, 3.7, 3.5, 3.9, 3.6, 3.3];
const targetTemp = [3.2, 3.2, 3.2, 3.2, 3.2, 3.2, 3.2];

export default function EnergyWidget() {
  return (
    <div className="widget-card widget-energy-widget">
      <div className="widget-title">
        <span>Energy widget</span>
      </div>

      <Box className="trend-layout">
        <Box className="trend-left">
          <Typography className="trend-kpi-value">3.5C</Typography>
          <Typography className="trend-kpi-label">Avg cabinet temp</Typography>
          <Typography className="trend-kpi-sub">Last 24 hours</Typography>
        </Box>

        <Box className="trend-right">
          <LineChart
            xAxis={[
              {
                scaleType: "point",
                data: hours,
                tickLabelStyle: { fill: "var(--text-muted)", fontSize: 11 },
              },
            ]}
            yAxis={[
              {
                min: 2.6,
                max: 4.2,
                tickLabelStyle: { fill: "var(--text-muted)", fontSize: 11 },
              },
            ]}
            series={[
              {
                id: "avg-temp",
                data: avgTemp,
                label: "Average",
                curve: "monotoneX",
                color: "#d94d14",
                showMark: false,
              },
              
            ]}
            height={180}
            margin={{ left: 36, right: 18, top: 16, bottom: 30 }}
            grid={{ vertical: true, horizontal: true }}
            
            sx={{
              "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                stroke: "var(--border-color)",
              },
              "& .MuiChartsGrid-line": {
                stroke: "var(--border-color)",
                strokeDasharray: "2 4",
              },
            }}
          />
        </Box>
      </Box>
    </div>
  );
}
