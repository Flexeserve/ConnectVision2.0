import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

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
    element: ".widgets-beacon-target",
    popover: {
      title: "Widgets Panel",
      description:
        "Widgets to illustrate performance data, alerts or device status. The widgets can be resized and arranged to suit your needs and priorities.",
      side: "left",
      align: "start",
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
  {
    element: ".region-alerts-stack-target",
    popover: {
      title: "Alarms",
      description:
        "Status and performance alerts for the relevant region to draw your attention to any issues that need addressing",
      side: "right",
      align: "center",
    },
  },
];

export const createBusinessManagerBeaconTour = (stepIndex: number) => {
  const step = businessManagerTourSteps[stepIndex];
  if (!step) return null;

  const driverObj = driver({
    showProgress: false,
    steps: [step],
    showButtons: ["close"],
    smoothScroll: true,
    animate: true,
    popoverClass: "business-manager-tour-popover",
    onDestroyStarted: () => {
      driverObj.destroy();
    },
  });

  return driverObj;
};
