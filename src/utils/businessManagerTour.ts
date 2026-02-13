import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// Tour configuration for Business Manager Page
export const businessManagerTourSteps: DriveStep[] = [
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
        "Customise your settings here such as Initial Setup, Toggle Dark Mode & Logout",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: ".burows-beacon-target",
    popover: {
      title: "Business Units Overview",
      description:
        "View all your business units here. Each unit shows offline devices and active alarms.",
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
      description:
        "Search by location name or number to quickly find specific business units or stores.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: ".widgets-beacon-target",
    popover: {
      title: "Widgets Panel",
      description:
        "Operational widgets and analytics. View real-time data about your operations including fan life, energy usage, and system health.",
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
];

// Create and configure the driver instance
export const createBusinessManagerTour = () => {
  const driverObj = driver({
    showProgress: true,
    steps: businessManagerTourSteps,
    nextBtnText: "Next →",
    prevBtnText: "← Previous",
    doneBtnText: "Finish",
    progressText: "{{current}} of {{total}}",
    showButtons: ["next", "previous", "close"],

    // Styling
    popoverClass: "business-manager-tour-popover",

    // Callbacks
    onDestroyStarted: () => {
      // No localStorage saving for kiosk demo mode
      driverObj.destroy();
    },

    // Smooth scrolling
    smoothScroll: true,

    // Animation duration
    animate: true,
  });

  return driverObj;
};
