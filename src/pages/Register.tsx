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
    return <div>Game not found. Please check the URL.</div>;
  }

  return (
    <div className="relative flex items-center gap-10 h-screen w-full">
      <img
        src={game.logoImage}
        alt={game.displayName}
        className="absolute top-5 right-5 max-w-36 w-full object-contain"
      />

      <img
        src="/img/gamelogo/atmos-base.png"
        alt="Logo Atmos"
        className="absolute bottom-5 right-5 w-24"
      />

      <img
        src={game.bgImage}
        alt={game.name}
        className="h-screen w-full max-w-130 object-cover"
      />

      <RegisterForm selectedGame={game} />
    </div>
  );
};
