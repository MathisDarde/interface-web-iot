import { clsx as cn } from "clsx";
import type { Game } from "../../types/types";

interface Props {
  size?: "small" | "medium" | "large";
  game: Game;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Button({
  size = "medium",
  game,
  children,
  onClick,
  className,
}: Props) {
  if (!game) {
    return null;
  }

  const sizeClasses = {
    small: "px-4 py-2 text-sm",
    medium: "px-6 py-3 text-base",
    large: "px-8 py-4 text-lg",
  };

  const gameStyles = {
    pokemon: {
      bg: "from-red-600 to-red-700",
      hover: "hover:from-red-700 hover:to-red-800",
    },
    yugioh: {
      bg: "from-amber-500 to-amber-600",
      hover: "hover:from-amber-600 hover:to-amber-700",
    },
    lorcana: {
      bg: "from-purple-600 to-purple-700",
      hover: "hover:from-purple-700 hover:to-purple-800",
    },
    magic: {
      bg: "from-red-700 to-red-800",
      hover: "hover:from-red-800 hover:to-red-900",
    },
    onepiece: {
      bg: "from-gray-900 to-black",
      hover: "hover:from-gray-950 hover:to-black",
    },
  } as const;

  const style =
    gameStyles[game.name as keyof typeof gameStyles] || gameStyles.pokemon;

  return (
    <button
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "bg-linear-to-br",
        style.bg,
        style.hover,
        "font-bold rounded-lg",
        "transition-all duration-300 ease-out",
        "uppercase",
        "font-Lato",
        "font-bold",
        "tracking-wider",
        "cursor-pointer",
        "active:scale-95",
        "text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}
