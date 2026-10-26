import Image from "next/image";
import avatarIcon from "@pulse/assets/images/avatar-icon.png";
import { cn } from "@/lib/utils";

/** The AI's face in Pulse: a grey "UX" disc with a violet ring, next to every answer. */
export function UxAvatar({ className }: { className?: string }) {
  return (
    <Image
      src={avatarIcon}
      alt="reloadux"
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-full object-cover", className)}
    />
  );
}
