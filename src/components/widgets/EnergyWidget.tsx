import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Card, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import "./WidgetBase.css";
import "./EnergyWidget.css";
import { createSeededRandom, seededFloat } from "../../lib/seededRandom";

const hours = ["00", "04", "08", "12", "16", "20", "24"];

const buildStoreTemp = (storeId: string) => {
  const rand = createSeededRandom(`${storeId}:cabinet-temp`);
  const baseline = seededFloat(`${storeId}:cabinet-temp-base`, 2.9, 4.1, 1);
  return hours.map(() => baseline + (rand() - 0.5) * 0.8);
};

// Cabinet temperature is a sensor reading, not a countable quantity, so the
// scope's trend is the pointwise average of its stores' own readings — a
// single store shows its own native trend, a region/root the blended trend.
const buildAvgTemp = (storeIds: string[]) => {
  const perStore = storeIds.map(buildStoreTemp);
  return hours.map((_, i) =>
    Math.round((perStore.reduce((sum, series) => sum + series[i], 0) / perStore.length) * 10) /
    10,
  );
};

type EnergyWidgetProps = {
  storeIds?: string[];
};

// Below this, the chart can't render legibly next to the KPI value — fall
// back to just the value, expanded to fill the card.
const MIN_CHART_HEIGHT = 150;
const MIN_CHART_WIDTH = 260;

export default function EnergyWidget({ storeIds = ["root"] }: EnergyWidgetProps) {
  const avgTemp = useMemo(() => buildAvgTemp(storeIds), [storeIds]);
  const avgTempMean =
    Math.round((avgTemp.reduce((sum, v) => sum + v, 0) / avgTemp.length) * 10) / 10;
  const widgetRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(180);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(height < MIN_CHART_HEIGHT || width < MIN_CHART_WIDTH);
        setChartHeight(Math.max(100, height - 8));
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Card ref={widgetRef} className="widget-card widget-energy-widget">
      <div className="widget-title">
        <span>Energy widget</span>
      </div>

      <Box className={`trend-layout ${isCompact ? "trend-layout--compact" : ""}`}>
        <Box className="trend-left">
          <Typography className="trend-kpi-value">{avgTempMean}C</Typography>
          <Typography className="trend-kpi-label">Avg cabinet temp</Typography>
          <Typography className="trend-kpi-sub">Last 24 hours</Typography>
        </Box>

        {!isCompact && (
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
                  min: 2.2,
                  max: 4.8,
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
              height={chartHeight}
              margin={{ left: 36, right: 18, top: 16, bottom: 30 }}
              grid={{ vertical: true, horizontal: true }}
              hideLegend
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
        )}
      </Box>
    </Card>
  );
}
