import type { Game } from "../../types/types";
import styles from "./GameSelector.module.css";
import LoginForm from "../pages/_components/LoginForm";

interface Props {
  game: Game;
  animationState?: "idle" | "enter" | "exit";
}

export default function GameRender({ game, animationState = "idle" }: Props) {
  const imageAnimClass =
    animationState === "exit"
      ? styles.imageExit
      : animationState === "enter"
        ? styles.imageEnter
        : "";

  const contentAnimClass =
    animationState === "exit"
      ? styles.contentExit
      : animationState === "enter"
        ? styles.contentEnter
        : "";

  const logoAnimClass =
    animationState === "exit"
      ? styles.logoExit
      : animationState === "enter"
        ? styles.logoEnter
        : "";

  return (
    <div className="relative flex h-dvh w-full bg-slate-50 text-slate-900 overflow-hidden md:flex-row">
      {/* --- ZONE IMAGE (PC SEULEMENT) --- */}
      {/* Sur Mobile, on la cache complètement pour éliminer les lags et se focus sur le form */}
      <div
        className={`hidden md:absolute md:inset-0 md:z-0 md:block md:w-5/12 lg:w-1/2 md:h-dvh ${imageAnimClass}`}
      >
        <img
          src={game.bgImage}
          alt={game.name}
          loading="eager"
          className="h-full w-full object-cover object-center"
        />
        {/* CORRECTION DU FLASH SOMBRE: from-slate-50/0 au lieu de from-transparent */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-50/0 via-slate-50/70 to-slate-50" />
      </div>

      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-6 right-6 z-20 hidden w-16 opacity-10 mix-blend-multiply md:block lg:w-20"
      />

      {/* --- ZONE CONTENU (PARFAITEMENT CENTRÉE) --- */}
      <div
        className={`relative z-10 flex h-full w-full flex-col items-center justify-center md:justify-start mt-0 md:mt-8 px-6 md:ml-auto md:w-7/12 lg:w-1/2 ${contentAnimClass}`}
      >
        <div className="flex w-full max-w-sm flex-col items-center">
          <img
            src={game.logoImage}
            alt={game.name}
            loading="eager"
            className={`mb-2 h-auto w-48 object-contain sm:w-56 md:mb-8 md:w-64 ${logoAnimClass}`}
          />

          <div
            className="mb-4 h-1 w-12 rounded-full"
            style={{ backgroundColor: game.mainColor }}
          />

          <LoginForm selectedGame={game} />
        </div>
      </div>
    </div>
  );
}
