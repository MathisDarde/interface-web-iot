import type { Game } from "../../types/types";
import Button from "./Button";
import styles from "./GameSelector.module.css";

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

  const numberAnimClass =
    animationState === "exit"
      ? styles.numberExit
      : animationState === "enter"
        ? styles.numberEnter
        : "";

  return (
    <div className="relative flex items-center gap-10 h-screen w-full">
      <img
        src={game.logoImage}
        alt={game.name}
        className={`absolute top-5 right-5 max-w-36 w-full object-contain ${logoAnimClass}`}
      />

      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-5 right-5 w-24"
      />

      <img
        src={game.bgImage}
        alt={game.name}
        className={`h-screen w-full max-w-130 object-cover ${imageAnimClass}`}
      />

      <div
        className={`flex-1 flex flex-col items-start justify-center gap-4 ${contentAnimClass}`}
      >
        <div className={numberAnimClass}>
          <span className="font-Lato text-xl font-medium">#00{game.id}</span>
          <h2
            className={`text-6xl font-extrabold italic transition-colors duration-300 uppercase font-Montserrat`}
          >
            {game.displayName}
          </h2>
        </div>

        <p className="font-Lato">
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
          className="flex items-center gap-4"
          onClick={() => {
            window.location.href = `/login?game=${game.name}`;
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
