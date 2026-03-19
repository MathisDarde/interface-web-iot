import { useCallback, useEffect, useRef, useState } from "react";
import GameRender from "./GameRender";
import type { Game } from "../../types/types";
import gamesJson from "../_assets/games-data.json";

const TRANSITION_MS = 650;
const WHEEL_COOLDOWN_MS = 450;

export default function GameSelector() {
  const games = gamesJson as unknown as Game[];

  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [outgoingGameIndex, setOutgoingGameIndex] = useState<number | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTimeoutRef = useRef<number | null>(null);
  const lastWheelAtRef = useRef(0);
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

    const onWheel = (event: WheelEvent) => {
      // mini-scroll => toggle direct
      if (games.length === 0) return;

      if (isTransitioningRef.current) {
        event.preventDefault();
        return;
      }

      if (Math.abs(event.deltaY) < 1) return;

      const now = Date.now();
      if (now - lastWheelAtRef.current < WHEEL_COOLDOWN_MS) {
        event.preventDefault();
        return;
      }

      lastWheelAtRef.current = now;
      event.preventDefault();

      navigate(event.deltaY > 0 ? "next" : "prev");
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      // Only clear the transition timeout on unmount.
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [games.length, navigate]);

  if (games.length === 0) return null;

  return (
    <div className="relative h-screen w-full overflow-hidden">
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
    </div>
  );
}
