import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "../styles/tour.css";
import WidgetPanelTooltip from "../components/widgets/widgetLegend";

const WIDGETS_PANEL_ELEMENT = ".widgets-beacon-target";

export const businessManagerTourSteps: DriveStep[] = [
  {
    element: ".bm-container-beacon",
    popover: {
      title: "Organise Locations",
      description:
        "Group and organise all your locations into regions and sub-regions that make sense to your business model",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: ".header-logo",
    popover: {
      title: "Company Logo",
      description: "Your company logo would go here",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: ".settings-button",
    popover: {
      title: "Settings",
      description:
        "Customise your settings here such as Initial Setup, Toggle Dark Mode and Logout",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: ".burows-beacon-target",
    popover: {
      title: "Business Units Overview",
      description:
        "Group and organise all your locations into regions and sub-regions that make sense to your business model",
      side: "right",
      align: "start",
    },
  },
  {
    element: ".offline-beacon-target",
    popover: {
      title: "Offline Count",
      description: "This shows the number of offline devices for this business unit.",
      side: "right",
      align: "center",
    },
  },
  {
    element: ".alarms-beacon-target",
    popover: {
      title: "Active Alarms",
      description:
        "View the count of active alarms that require attention for this business unit.",
      side: "right",
      align: "center",
    },
  },
  {
    element: ".search-beacon-target",
    popover: {
      title: "Search",
      description: "Find a particular location via store name.",
      side: "bottom",
      align: "start",
    },
  },
  {
    // The description below is a fallback only — onPopoverRender replaces it
    // with the full widget legend (icon + blurb per widget) once mounted.
    element: WIDGETS_PANEL_ELEMENT,
    popover: {
      title: "Widgets Panel",
      description:
        "Widgets to illustrate performance data, alerts or device status. The widgets can be resized and arranged to suit your needs and priorities.",
      side: "left",
      align: "start",
      popoverClass: "business-manager-tour-popover widgets-legend-popover",
    },
  },
  {
    element: ".dashboard-edit-button",
    popover: {
      title: "Customize Widgets",
      description:
        "Click here to enter edit mode. You can then drag to rearrange widgets, resize them, or customize your dashboard layout. Changes are saved automatically.",
      side: "bottom",
      align: "end",
    },
  },
];

export const createBusinessManagerBeaconTour = (stepIndex: number) => {
  const step = businessManagerTourSteps[stepIndex];
  if (!step) return null;

  let legendRoot: Root | null = null;

  const driverObj = driver({
    showProgress: false,
    steps: [step],
    showButtons: ["close"],
    smoothScroll: true,
    animate: true,
    popoverClass: "business-manager-tour-popover",
    onPopoverRender: (popover) => {
      // Each tour instance here is scoped to exactly one step (`steps: [step]`
      // above), so `step` itself — not driver.js's `state.activeStep`, which
      // isn't reliably populated yet on this very first render — tells us
      // whether this is the widgets-panel step.
      if (step.element !== WIDGETS_PANEL_ELEMENT) return;
      popover.description.innerHTML = "";
      legendRoot = createRoot(popover.description);
      legendRoot.render(createElement(WidgetPanelTooltip));
    },
    onDestroyStarted: () => {
      legendRoot?.unmount();
      legendRoot = null;
      driverObj.destroy();
    },
  });

  return driverObj;
};
