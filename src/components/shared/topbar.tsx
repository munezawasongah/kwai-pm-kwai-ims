"use client";

import { useSession, signOut } from "next-auth/react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <p className="text-sm text-gray-500">Welcome{session?.user?.name ? `, ${session.user.name}` : ""}</p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm font-medium text-gray-500 hover:text-brand"
      >
        Sign out
      </button>
    </header>
  );
}
