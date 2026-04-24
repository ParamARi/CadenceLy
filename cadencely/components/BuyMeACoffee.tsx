import type { ReactNode } from "react";
import { CiCoffeeCup } from "react-icons/ci";

export const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/param.ri.dev";

const anchorClassName =
  "inline-flex items-center gap-1 font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-400 dark:hover:text-amber-300";

function BuyMeACoffeeAnchor({
  children,
  className = "",
  iconClassName = "h-[1.1em] w-[1.1em] shrink-0 opacity-90",
}: {
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={[anchorClassName, className].filter(Boolean).join(" ")}
    >
      <CiCoffeeCup className={iconClassName} aria-hidden />
      {children}
    </a>
  );
}

type BuyMeACoffeeProps = {
  variant: "header" | "postPlaylist";
};

/** Buy Me a Coffee — site header link or message after creating a YouTube playlist. */
export function BuyMeACoffee({ variant }: BuyMeACoffeeProps) {
  if (variant === "header") {
    return (
      <BuyMeACoffeeAnchor className="text-sm">Buy me a coffee</BuyMeACoffeeAnchor>
    );
  }
  return (
    <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
      If DJ-Cadence saved you a few minutes, consider{" "}
      <BuyMeACoffeeAnchor>buying me a coffee</BuyMeACoffeeAnchor>.
    </p>
  );
}
