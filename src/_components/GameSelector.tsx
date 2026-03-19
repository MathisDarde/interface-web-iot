import { useCallback, useEffect, useRef, useState } from "react";
import GameRender from "./GameRender";
import type { Game } from "../../types/types";
import gamesJson from "../_assets/games-data.json";

const TRANSITION_MS = 650;

export default function GameSelector() {
  const games = gamesJson as unknown as Game[];

  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [outgoingGameIndex, setOutgoingGameIndex] = useState<number | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  const navigate = useCallback(
    (direction: "next" | "prev") => {
      if (games.length === 0) return;
      if (isTransitioningRef.current) return;

      setIsTransitioning(true);
      isTransitioningRef.current = true;

      setActiveGameIndex((prevIndex) => {
        setOutgoingGameIndex(prevIndex);
        return direction === "next"
          ? (prevIndex + 1) % games.length
          : (prevIndex - 1 + games.length) % games.length;
      });

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setOutgoingGameIndex(null);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, TRANSITION_MS);
    },
    [games.length],
  );

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (games.length === 0) return;
      if (isTransitioningRef.current) return;

      const normalizedIndex =
        ((nextIndex % games.length) + games.length) % games.length;

      if (normalizedIndex === activeGameIndex) return;

      setIsTransitioning(true);
      isTransitioningRef.current = true;

      setOutgoingGameIndex(activeGameIndex);
      setActiveGameIndex(normalizedIndex);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setOutgoingGameIndex(null);
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, TRANSITION_MS);
    },
    [activeGameIndex, games.length],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate("next");
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate("prev");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // Only clear the transition timeout on unmount.
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [navigate]);

  if (games.length === 0) return null;

  const activeGame = games[activeGameIndex];

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {outgoingGameIndex !== null && (
        <div className="absolute inset-0 pointer-events-none">
          <GameRender game={games[outgoingGameIndex]} animationState="exit" />
        </div>
      )}

      <div className="absolute inset-0">
        <GameRender
          game={games[activeGameIndex]}
          animationState={outgoingGameIndex !== null ? "enter" : "idle"}
        />
      </div>

      <div className="absolute left-3 right-3 top-3 z-20 sm:left-4 sm:right-4 sm:top-4">
        <div className="mx-auto w-full max-w-5xl rounded-xl border bg-white/90 p-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-2 font-Lato text-sm disabled:opacity-60"
                onClick={() => navigate("prev")}
                disabled={isTransitioning}
                aria-label="Jeu précédent"
              >
                ←
              </button>

              <div className="min-w-0 text-center font-Lato text-sm sm:hidden">
                {activeGame.displayName}
              </div>

              <button
                type="button"
                className="rounded-lg border px-3 py-2 font-Lato text-sm disabled:opacity-60"
                onClick={() => navigate("next")}
                disabled={isTransitioning}
                aria-label="Jeu suivant"
              >
                →
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {games.map((game, index) => {
                const isActive = index === activeGameIndex;
                return (
                  <button
                    key={game.id}
                    type="button"
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-Lato text-sm transition-opacity disabled:opacity-60 ${
                      isActive ? "text-white" : "hover:opacity-90"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: game.mainColor,
                            borderColor: game.mainColor,
                          }
                        : {
                            borderColor: game.mainColor,
                          }
                    }
                    onClick={() => goToIndex(index)}
                    disabled={isTransitioning}
                    aria-pressed={isActive}
                  >
                    <img
                      src={game.iconImage}
                      alt=""
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span className="hidden sm:inline">{game.displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
