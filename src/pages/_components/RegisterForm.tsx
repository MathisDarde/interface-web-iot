import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Game } from "../../../types/types";
import { postJson } from "../../api";

export default function RegisterForm({ selectedGame }: { selectedGame: Game }) {
  const navigate = useNavigate();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await postJson<{
        token: string;
        user: { id: string; email: string; pseudo: string; phone: string };
      }>("/auth/register", { pseudo, email, phone, password });

      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("auth_user", JSON.stringify(result.user));

      navigate("/admin", { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "REGISTER_FAILED";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-xs sm:max-w-sm">
      <form className="flex w-full flex-col gap-5" onSubmit={onSubmit}>
        {/* Champ Pseudo */}
        <div className="flex flex-col gap-1">
          <label className="font-Lato text-xs font-bold uppercase tracking-wider text-slate-400">
            Pseudo
          </label>
          <input
            type="text"
            className="w-full border-b border-slate-300 bg-transparent py-2 font-Lato text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            autoComplete="nickname"
            required
          />
        </div>

        {/* Champ Email */}
        <div className="flex flex-col gap-1">
          <label className="font-Lato text-xs font-bold uppercase tracking-wider text-slate-400">
            Email
          </label>
          <input
            type="email"
            className="w-full border-b border-slate-300 bg-transparent py-2 font-Lato text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {/* Champ Téléphone */}
        <div className="flex flex-col gap-1">
          <label className="font-Lato text-xs font-bold uppercase tracking-wider text-slate-400">
            Téléphone
          </label>
          <input
            type="tel"
            className="w-full border-b border-slate-300 bg-transparent py-2 font-Lato text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </div>

        {/* Champ Mot de passe */}
        <div className="flex flex-col gap-1">
          <label className="font-Lato text-xs font-bold uppercase tracking-wider text-slate-400">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              className="w-full border-b border-slate-300 bg-transparent py-2 pr-10 font-Lato text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {/* Icône Oeil */}
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-800"
            >
              {isPasswordVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 640 512"
                >
                  <path d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346.39 397.39a144.13 144.13 0 0 1-26.39 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 576 512"
                >
                  <path d="M288 144a110.94 110.94 0 0 0-31.24 5 55.4 55.4 0 0 1 7.24 27 56 56 0 0 1-56 56 55.4 55.4 0 0 1-27-7.24A111.71 111.71 0 1 0 288 144zm284.52 97.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400c-98.65 0-189.09-55-237.93-144C98.91 167 189.34 112 288 112s189.09 55 237.93 144C477.1 345 386.66 400 288 400z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="text-center font-Lato text-xs text-red-500">
            {error === "EMAIL_ALREADY_USED"
              ? "Cet email est déjà utilisé."
              : `Erreur: ${error}`}
          </p>
        )}

        {/* Bouton de validation */}
        <button
          type="submit"
          className="mt-4 w-full rounded-full px-4 py-3 font-Montserrat text-xs sm:text-sm font-bold tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: selectedGame.mainColor }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "CRÉATION..." : "CRÉER LE COMPTE"}
        </button>
      </form>

      {/* Liens secondaires (Se connecter / Retour) */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="font-Lato text-xs sm:text-sm text-slate-500">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() =>
              navigate(`/login?game=${encodeURIComponent(selectedGame.name)}`)
            }
            className="font-bold transition-colors hover:underline"
            style={{ color: selectedGame.mainColor }}
          >
            Se connecter
          </button>
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="font-Lato text-xs text-slate-400 transition-colors hover:text-slate-700"
        >
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
