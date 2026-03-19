import { useSearchParams } from "react-router-dom";
import LoginForm from "./_components/LoginForm";
import gamesJson from "../_assets/games-data.json";

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const gameParam = searchParams.get("game");

  console.log("Game param:", gameParam);

  const game = gamesJson.find(
    (g) => g.name.toLowerCase() === gameParam?.toLowerCase(),
  );

  console.log("Selected game:", game);

  if (!game) {
    return <div>Game not found. Please check the URL.</div>;
  }

  return (
    <div className="relative flex h-dvh w-full flex-col gap-6 overflow-hidden md:flex-row md:items-center md:gap-10">
      <img
        src={game.logoImage}
        alt={game.displayName}
        className="absolute right-4 top-4 w-24 object-contain sm:right-5 sm:top-5 sm:w-32 md:w-36"
      />

      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-4 right-4 w-16 sm:bottom-5 sm:right-5 sm:w-20 md:w-24"
      />

      <img
        src={game.bgImage}
        alt={game.name}
        className="h-56 w-full shrink-0 object-cover sm:h-80 md:h-dvh md:w-auto md:max-w-[32rem]"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <LoginForm selectedGame={game} />
      </div>
    </div>
  );
};
