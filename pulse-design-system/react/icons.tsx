// The lucide icons the app uses, inlined (identical paths, ISC licence) so the
// kit doesn't need lucide-react. Same API shape: className + strokeWidth.
import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { strokeWidth?: number };

function make(paths: ReactNode, displayName: string) {
  function Icon({ strokeWidth = 2, className = "rx-icon", ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...rest}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const ArrowRight = make(<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>, "ArrowRight");
export const ArrowUp = make(<><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></>, "ArrowUp");
export const ArrowDown = make(<><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>, "ArrowDown");
export const Paperclip = make(
  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  "Paperclip"
);
export const Mic = make(
  <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>,
  "Mic"
);
export const Sun = make(
  <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>,
  "Sun"
);
export const Moon = make(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />, "Moon");
export const Check = make(<path d="M20 6 9 17l-5-5" />, "Check");
export const Download = make(
  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></>,
  "Download"
);
export const Upload = make(
  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>,
  "Upload"
);
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />, "ChevronDown");
export const ChevronLeft = make(<path d="m15 18-6-6 6-6" />, "ChevronLeft");
export const ChevronRight = make(<path d="m9 18 6-6-6-6" />, "ChevronRight");
export const X = make(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>, "X");
export const FileText = make(
  <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  "FileText"
);
export const Plus = make(<><path d="M5 12h14" /><path d="M12 5v14" /></>, "Plus");
export const Trash2 = make(
  <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></>,
  "Trash2"
);
export const GripVertical = make(
  <><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></>,
  "GripVertical"
);
