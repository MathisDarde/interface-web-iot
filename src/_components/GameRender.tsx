import type { Game } from "../../types/types";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import styles from "./GameSelector.module.css";

interface Props {
  game: Game;
  animationState?: "idle" | "enter" | "exit";
}

export default function GameRender({ game, animationState = "idle" }: Props) {
  const navigate = useNavigate();

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

  const numberAnimClass =
    animationState === "exit"
      ? styles.numberExit
      : animationState === "enter"
        ? styles.numberEnter
        : "";

  return (
    <div className="relative flex h-dvh w-full flex-col gap-6 overflow-hidden md:flex-row md:items-center md:gap-10">
      <img
        src={game.logoImage}
        alt={game.name}
        className={`absolute right-4 top-4 w-24 object-contain sm:right-5 sm:top-5 sm:w-32 md:w-36 ${logoAnimClass}`}
      />

      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-4 right-4 w-16 sm:bottom-5 sm:right-5 sm:w-20 md:w-24"
      />

      <img
        src={game.bgImage}
        alt={game.name}
        className={`h-56 w-full shrink-0 object-cover sm:h-80 md:h-dvh md:w-auto md:max-w-[32rem] ${imageAnimClass}`}
      />

      <div
        className={`min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 sm:px-6 md:px-0 md:py-0 ${contentAnimClass}`}
      >
        <div className={numberAnimClass}>
          <span className="font-Lato text-base font-medium sm:text-xl">
            #00{game.id}
          </span>
          <h2
            className="font-Montserrat text-3xl font-extrabold italic uppercase transition-colors duration-300 sm:text-5xl lg:text-6xl"
          >
            {game.displayName}
          </h2>
        </div>

        <p className="font-Lato text-sm leading-relaxed sm:text-base sm:leading-normal md:max-w-prose">
          Plongez dans l’univers du jeu de cartes Pokémon, là où chaque carte
          peut tout changer. Assemblez votre deck, invoquez vos Pokémon préférés
          et affrontez vos adversaires dans des duels intenses et stratégiques.
          Une pioche, une attaque, un retournement de situation… la victoire se
          joue parfois à un seul instant. Entre puissance, réflexion et
          frissons, le JCC Pokémon transforme chaque partie en combat épique.
          Êtes-vous prêt à relever le défi et devenir Maître Pokémon ?
        </p>

        <Button
          game={game}
          key={game.id}
          size="medium"
          className="flex w-full items-center justify-center gap-4 sm:w-auto"
          onClick={() => {
            navigate(`/login?game=${encodeURIComponent(game.name)}`);
          }}
        >
          <span>Jouer</span>
          <img
            src={game.iconImage}
            alt="game icon"
            className="w-8 aspect-square object-contain"
          />
        </Button>
      </div>
    </div>
  );
}
