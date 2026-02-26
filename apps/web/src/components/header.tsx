"use client";

import Link from "next/link";
import { Authenticated } from "convex/react";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Separator } from "./ui/separator";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <Link href="/" className="text-lg font-bold">
          Paddlerino
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Authenticated>
            <UserMenu />
          </Authenticated>
        </div>
      </div>
      <Separator />
    </div>
  );
}
