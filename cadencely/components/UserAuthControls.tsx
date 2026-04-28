"use client";

import { useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button, Select, Spinner } from "flowbite-react";

/**
 * Google sign-in / sign-out for the home header. Feedback submission requires a session.
 */
export default function UserAuthControls() {
  const { data: session, status } = useSession();
  const providers = useMemo(
    () => [
      { id: "google", label: "YouTube (Google)" },
      { id: "spotify", label: "Spotify" },
    ],
    []
  );
  const [providerId, setProviderId] = useState<(typeof providers)[number]["id"]>(
    providers[0].id
  );

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
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        sizing="sm"
        value={providerId}
        onChange={(e) => setProviderId(e.target.value as (typeof providers)[number]["id"])}
        className="min-w-[180px]"
        aria-label="Music platform"
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </Select>
      <Button color="light" size="sm" onClick={() => void signIn(providerId, { callbackUrl: "/" })}>
        Sign in
      </Button>
    </div>
  );
}
