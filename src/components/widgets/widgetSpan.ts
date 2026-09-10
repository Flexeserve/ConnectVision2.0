import { createContext } from "react";

// The current grid span of a widget, supplied by the SortableWidget wrapper
// in BusinessManagerPage. <Widget> reads it to decide whether being resized
// large should also switch it to its detailed view.
export type WidgetSpan = { c: number; r: number };

export const WidgetSpanContext = createContext<WidgetSpan | null>(null);
