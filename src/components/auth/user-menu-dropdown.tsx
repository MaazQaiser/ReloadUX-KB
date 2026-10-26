"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./user-avatar";

interface MenuUser {
  name: string;
  email: string;
  photoUrl?: string;
  /** The designation if they've set one, otherwise their role. */
  subtitle: string;
}

export function UserMenuDropdown({ user }: { user: MenuUser }) {
  // Sign-out is a POST form outside the menu, so closing the menu can't cancel it.
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-3 rounded-full py-1 pr-2.5 pl-1 text-left transition-colors duration-300 outline-none hover:bg-muted focus-visible:ring-4 focus-visible:ring-ring/15 aria-expanded:bg-muted"
          aria-label={`Account menu for ${user.name}`}
        >
          <UserAvatar name={user.name} photoUrl={user.photoUrl} />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.subtitle}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
            <UserAvatar name={user.name} photoUrl={user.photoUrl} className="size-10" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-foreground">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserRound aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => signOutForm.current?.requestSubmit()}>
            <LogOut aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form ref={signOutForm} action="/api/auth/signout" method="post" hidden />
    </>
  );
}
