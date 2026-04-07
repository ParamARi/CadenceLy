"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button, Spinner } from "flowbite-react";

/**
 * Google sign-in / sign-out for the home header. Feedback submission requires a session.
 */
export default function UserAuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Spinner size="sm" />
        <span>Checking account…</span>
      </div>
    );
  }

  if (session?.user) {
    const label =
      session.user.email ?? session.user.name ?? "Signed in";
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
        <span
          className="max-w-[200px] truncate text-gray-600 dark:text-gray-300"
          title={label}
        >
          {label}
        </span>
        <Button color="gray" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button
      color="light"
      size="sm"
      onClick={() => void signIn("google", { callbackUrl: "/" })}
    >
      Sign in with Google
    </Button>
  );
}
