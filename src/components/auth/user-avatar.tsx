import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** "Maaz Qaiser" → "MQ"; an email falls back to its first letter. */
export function initials(name: string): string {
  const words = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}

export function UserAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string; className?: string }) {
  return (
    <Avatar className={cn("size-9 border", className)}>
      {/* Google profile photos refuse requests that carry a referrer. */}
      {photoUrl && <AvatarImage src={photoUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
