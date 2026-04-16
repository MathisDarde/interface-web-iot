import { useSearchParams } from "react-router-dom";
import RegisterForm from "./_components/RegisterForm";
import gamesJson from "../_assets/games-data.json";

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get("game");

  const game = gamesJson.find(
    (g) => g.name.toLowerCase() === gameParam?.toLowerCase(),
  );

  if (!game) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-slate-50 text-slate-500 font-Lato">
        Jeu introuvable. Veuillez vérifier l'URL.
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full bg-slate-50 text-slate-900 overflow-hidden md:flex-row">
      {/* --- ZONE IMAGE (PC SEULEMENT) --- */}
      {/* Sur Mobile, cachée pour focus sur le formulaire. Sur Desktop, prend la moitié gauche */}
      <div className="hidden md:absolute md:inset-0 md:z-0 md:block md:w-5/12 lg:w-1/2 md:h-dvh">
        <img
          src={game.bgImage}
          alt={game.name}
          loading="eager"
          className="h-full w-full object-cover object-center"
        />
        {/* Dégradé doux vers le blanc pour fondre l'image */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/0 via-slate-50/70 to-slate-50" />
      </div>

      {/* --- LOGO ATMOS --- */}
      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-6 right-6 z-20 hidden w-16 opacity-10 mix-blend-multiply md:block lg:w-20"
      />

      {/* --- ZONE CONTENU (PARFAITEMENT CENTRÉE) --- */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 md:ml-auto md:w-7/12 lg:w-1/2">
        <div className="flex w-full max-w-sm flex-col items-center pb-24 md:pb-0">
          {/* Logo du Jeu */}
          <img
            src={game.logoImage}
            alt={game.displayName}
            loading="eager"
            className="mb-6 h-auto w-48 object-contain sm:w-56 md:mb-8 md:w-64"
          />

          {/* Ligne séparatrice de la couleur du jeu */}
          <div
            className="mb-8 h-1 w-12 rounded-full"
            style={{ backgroundColor: game.mainColor }}
          />

          {/* Formulaire d'inscription */}
          <RegisterForm selectedGame={game} />
        </div>
      </div>
    </div>
  );
};
