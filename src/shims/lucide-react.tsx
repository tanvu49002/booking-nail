"use client";

import * as React from "react";

export type LucideProps = React.SVGProps<SVGSVGElement> & {
  color?: string;
  size?: number | string;
};

function createIcon(displayName: string) {
  const Icon = React.forwardRef<SVGSVGElement, LucideProps>(function Icon(
    { size = 16, color = "currentColor", ...props },
    ref
  ) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...props}
      >
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 12h8" />
      </svg>
    );
  });

  Icon.displayName = displayName;
  return Icon;
}

export const AlertCircle = createIcon("AlertCircle");
export const ArrowLeft = createIcon("ArrowLeft");
export const ArrowRight = createIcon("ArrowRight");
export const Bath = createIcon("Bath");
export const Calendar = createIcon("Calendar");
export const CalendarCheck = createIcon("CalendarCheck");
export const CalendarClock = createIcon("CalendarClock");
export const CalendarIcon = createIcon("CalendarIcon");
export const CalendarPlus = createIcon("CalendarPlus");
export const Check = createIcon("Check");
export const CheckCircle = createIcon("CheckCircle");
export const CheckCircle2 = createIcon("CheckCircle2");
export const CheckIcon = createIcon("CheckIcon");
export const ChevronDown = createIcon("ChevronDown");
export const ChevronDownIcon = createIcon("ChevronDownIcon");
export const ChevronLeft = createIcon("ChevronLeft");
export const ChevronRight = createIcon("ChevronRight");
export const ChevronUpIcon = createIcon("ChevronUpIcon");
export const Clock = createIcon("Clock");
export const DollarSign = createIcon("DollarSign");
export const FileText = createIcon("FileText");
export const Loader2 = createIcon("Loader2");
export const Mail = createIcon("Mail");
export const MapPin = createIcon("MapPin");
export const NotepadText = createIcon("NotepadText");
export const Phone = createIcon("Phone");
export const Search = createIcon("Search");
export const Sparkles = createIcon("Sparkles");
export const Store = createIcon("Store");
export const User = createIcon("User");
export const Users = createIcon("Users");
