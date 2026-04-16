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
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [navigate]);

  if (games.length === 0) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-50">
      {/* RENDU DU JEU (ARRIÈRE-PLAN) */}
      {outgoingGameIndex !== null && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-20 sm:bottom-24 md:bottom-0">
          <GameRender game={games[outgoingGameIndex]} animationState="exit" />
        </div>
      )}

      <div className="absolute inset-x-0 top-0 bottom-20 sm:bottom-24 md:bottom-0">
        <GameRender
          game={games[activeGameIndex]}
          animationState={outgoingGameIndex !== null ? "enter" : "idle"}
        />
      </div>

      {/* DOCK DE NAVIGATION ÉPURÉ MODE CLAIR (EN BAS) */}
      <div className="no-scrollbar absolute bottom-3 left-1/2 z-50 flex w-[calc(100vw-1rem)] max-w-[95vw] -translate-x-1/2 items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-white/60 bg-white/70 p-1.5 shadow-2xl shadow-slate-300/50 backdrop-blur-xl sm:bottom-6 sm:w-max sm:gap-2 sm:p-2 md:bottom-8 md:gap-4 md:p-3">
        {/* Flèche Précédent */}
        <button
          type="button"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 sm:h-10 sm:w-10 md:flex md:h-12 md:w-12 active:scale-95"
          onClick={() => navigate("prev")}
          disabled={isTransitioning}
          aria-label="Jeu précédent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* Liste des Jeux */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {games.map((game, index) => {
            const isActive = index === activeGameIndex;

            return (
              <button
                key={game.id}
                type="button"
                className={`group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-500 ease-in-out ${
                  isActive
                    ? "w-24 bg-white sm:w-32 md:w-48"
                    : "w-9 hover:bg-slate-100 sm:w-10 md:w-12"
                }`}
                style={
                  isActive
                    ? {
                        boxShadow: `0 4px 20px ${game.mainColor}25`,
                        border: `1px solid ${game.mainColor}60`,
                      }
                    : {
                        border: "1px solid transparent",
                      }
                }
                onClick={() => goToIndex(index)}
                disabled={isTransitioning}
                aria-pressed={isActive}
              >
                <div className="flex h-9 w-full items-center px-2 sm:h-10 md:h-12">
                  <img
                    src={game.iconImage}
                    alt=""
                    className={`h-5 w-5 shrink-0 object-contain transition-all duration-500 sm:h-6 sm:w-6 md:h-7 md:w-7 ${
                      isActive
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-40 grayscale group-hover:scale-100 group-hover:opacity-100 group-hover:grayscale-0"
                    }`}
                  />

                  {/* Nom du jeu (apparaît uniquement si actif) */}
                  <div
                    className={`flex-1 overflow-hidden transition-all duration-500 ${
                      isActive
                        ? "ml-1.5 opacity-100 sm:ml-2"
                        : "ml-0 w-0 opacity-0"
                    }`}
                  >
                    <span className="block truncate font-Montserrat text-[10px] font-extrabold uppercase tracking-wider text-slate-800 sm:text-xs md:text-sm">
                      {game.displayName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Flèche Suivant */}
        <button
          type="button"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 sm:h-10 sm:w-10 md:flex md:h-12 md:w-12 active:scale-95"
          onClick={() => navigate("next")}
          disabled={isTransitioning}
          aria-label="Jeu suivant"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
