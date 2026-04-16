import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteJson, getJson, patchJson, postJson } from "../api";
import { logout } from "../auth";
import gamesJson from "../_assets/games-data.json";
import type { Game } from "../../types/types";

// --- TYPES ---
type NfcStatus = "idle" | "scanning" | "success" | "error";

type NdefMessage = {
  records: Array<{
    recordType: string;
    mediaType?: string;
    data?: Uint8Array;
  }>;
};

type NDEFReaderLike = {
  write: (message: NdefMessage) => Promise<void>;
};

type WindowWithNdef = Window & {
  NDEFReader?: new () => NDEFReaderLike;
};

type PlayerRow = {
  id: string;
  pseudo: string;
  email: string;
  phone: string;
  createdAt: string;
};

type PlayersResponse = {
  items: PlayerRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const PAGE_SIZE = 10;
type ModalMode = "create" | "edit";
const ADMIN_GAME_KEY = "admin_game";

function getStoredAdminGameName(): string | null {
  return localStorage.getItem(ADMIN_GAME_KEY) || null;
}

function setStoredAdminGameName(gameName: string) {
  localStorage.setItem(ADMIN_GAME_KEY, gameName);
}

// ==========================================
// COMPOSANT PRINCIPAL : ADMIN PAGE
// ==========================================
export function AdminPage() {
  const navigate = useNavigate();
  const games = gamesJson as unknown as Game[];

  const [gameName, setGameName] = useState<string>(() => {
    return getStoredAdminGameName() ?? games[0]?.name ?? "pokemon";
  });

  const selectedGame = useMemo(() => {
    return (
      games.find((g) => g.name.toLowerCase() === gameName.toLowerCase()) ??
      games[0]
    );
  }, [gameName, games]);

  // États Joueur (Modale)
  const [playerModalMode, setPlayerModalMode] = useState<ModalMode | null>(
    null,
  );
  const [playerModalId, setPlayerModalId] = useState<string | null>(null);
  const [playerPseudo, setPlayerPseudo] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [playerModalError, setPlayerModalError] = useState<string | null>(null);

  // États Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [deletePlayerLabel, setDeletePlayerLabel] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // États Données
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PlayersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // NFC
  const [nfcStatus, setNfcStatus] = useState<NfcStatus>("idle");
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  function unauthorizedToHome(message: string) {
    if (message === "UNAUTHORIZED") {
      logout();
      navigate("/", { replace: true });
      return true;
    }
    return false;
  }

  function openCreateModal() {
    setPlayerModalMode("create");
    setPlayerModalId(null);
    setPlayerPseudo("");
    setPlayerEmail("");
    setPlayerPhone("");
    setPlayerModalError(null);
  }

  function openEditModal(player: PlayerRow) {
    setPlayerModalMode("edit");
    setPlayerModalId(player.id);
    setPlayerPseudo(player.pseudo);
    setPlayerEmail(player.email);
    setPlayerPhone(player.phone);
    setPlayerModalError(null);
  }

  function closePlayerModal() {
    setPlayerModalMode(null);
    setPlayerModalId(null);
    setPlayerModalError(null);
  }

  const queryParams = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, q: q.trim() || undefined }),
    [page, q],
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getJson<PlayersResponse>("/players", queryParams, {
          auth: true,
        });
        if (!cancelled) setData(res);
      } catch (e) {
        const message = e instanceof Error ? e.message : "FETCH_FAILED";
        if (!cancelled) {
          setError(message);
          unauthorizedToHome(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [queryParams, refreshKey]);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  async function handleNfcWrite(player: PlayerRow) {
    const NDEFReaderCtor = (window as unknown as WindowWithNdef).NDEFReader;
    if (!NDEFReaderCtor) {
      alert(
        "Le NFC n'est pas supporté par ce navigateur (essayez Chrome sur Android).",
      );
      return;
    }

    try {
      setNfcStatus("scanning");
      setNfcMessage(`Approchez la carte pour ${player.pseudo}...`);

      const ndef = new NDEFReaderCtor();
      await ndef.write({
        records: [
          {
            recordType: "mime",
            mediaType: "application/json",
            data: new TextEncoder().encode(
              JSON.stringify({
                id: player.id,
                pseudo: player.pseudo,
                email: player.email,
                phone: player.phone,
                gameName: selectedGame.name,
                version: "1.0",
              }),
            ),
          },
        ],
      });

      setNfcStatus("success");
      setNfcMessage("✅ Carte encodée avec succès !");
      setTimeout(() => {
        setNfcStatus("idle");
        setNfcMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Erreur NFC:", error);
      setNfcStatus("error");
      setNfcMessage("❌ Échec de l'écriture.");
      setTimeout(() => {
        setNfcStatus("idle");
        setNfcMessage(null);
      }, 3000);
    }
  }

  return (
    <div className="min-h-dvh w-full bg-slate-50 font-Lato text-slate-900 pb-20">
      {/* --- TOAST NFC --- */}
      {nfcStatus !== "idle" && (
        <div className="fixed inset-x-0 top-6 z-[100] flex justify-center pointer-events-none px-4">
          <div
            className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border text-sm sm:text-base font-bold text-white transition-all animate-in slide-in-from-top-4 ${
              nfcStatus === "scanning"
                ? "bg-blue-600/90 border-blue-400"
                : nfcStatus === "success"
                  ? "bg-emerald-600/90 border-emerald-400"
                  : "bg-red-600/90 border-red-400"
            }`}
          >
            {nfcMessage}
          </div>
        </div>
      )}

      {/* --- CONTAINER PRINCIPAL --- */}
      <div className="mx-auto max-w-6xl w-full px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        {/* EN-TÊTE : Titre + Déconnexion + Sélecteur */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-10">
          <div>
            <h1 className="font-Montserrat text-3xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
              Administration
            </h1>
            <button
              type="button"
              className="mt-2 text-sm text-slate-400 hover:text-slate-800 transition-colors font-medium flex items-center gap-1"
              onClick={() => setLogoutModalOpen(true)}
            >
              <span>←</span> Déconnexion
            </button>
          </div>

          <div className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-3 pr-9 py-1.5 shadow-sm">
            <div className="flex items-center">
              <img
                src={selectedGame.iconImage}
                alt=""
                className="w-5 h-5 object-contain"
              />
            </div>
            <select
              className="appearance-none bg-transparent pl-1 pr-2 py-1.5 font-Montserrat font-bold text-sm text-slate-800 outline-none cursor-pointer"
              value={selectedGame.name}
              onChange={(e) => {
                setGameName(e.target.value);
                setStoredAdminGameName(e.target.value);
              }}
            >
              {games.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.displayName}
                </option>
              ))}
            </select>
            {/* Custom Chevron since appearance-none removes it */}
            <svg
              className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* BARRE D'OUTILS : Recherche & Ajout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-100 shadow-sm"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un pseudo, email..."
            />
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 font-Montserrat text-sm font-bold tracking-wide text-white transition-all hover:opacity-90 shadow-lg active:scale-95 w-full sm:w-auto"
            style={{
              backgroundColor: selectedGame.mainColor,
              boxShadow: `0 8px 20px -6px ${selectedGame.mainColor}`,
            }}
            onClick={openCreateModal}
          >
            <span>+ AJOUTER UN JOUEUR</span>
          </button>
        </div>

        {/* GESTION DES ERREURS GLOBALES */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error === "UNAUTHORIZED" ? "Session expirée." : `Erreur: ${error}`}
          </div>
        )}

        {/* TABLEAU DES JOUEURS (Style Card Épurée) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr
                  className="border-b border-white/20"
                  style={{ backgroundColor: selectedGame.mainColor }}
                >
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/95">
                    Pseudo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/95">
                    Email
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/95">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/95">
                    Création
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white/95">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      className="py-8 text-center text-slate-400 text-sm"
                      colSpan={5}
                    >
                      Chargement des joueurs...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      className="py-8 text-center text-slate-400 text-sm"
                      colSpan={5}
                    >
                      Aucun joueur trouvé.
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {u.pseudo}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {u.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Bouton NFC */}
                          <button
                            type="button"
                            className={`p-2 rounded-full transition-all ${nfcStatus === "scanning" ? "opacity-30" : "hover:bg-blue-50 text-slate-400 hover:text-blue-600"}`}
                            title="Écrire sur carte NFC"
                            disabled={nfcStatus === "scanning"}
                            onClick={() => handleNfcWrite(u)}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 640 512"
                            >
                              <path d="M285.7 368C384.2 368 464 447.8 464 546.3C464 562.7 450.7 576 434.3 576L77.7 576C61.3 576 48 562.7 48 546.3C48 447.8 127.8 368 226.3 368L285.7 368zM528 144C541.3 144 552 154.7 552 168L552 216L600 216C613.3 216 624 226.7 624 240C624 253.3 613.3 264 600 264L552 264L552 312C552 325.3 541.3 336 528 336C514.7 336 504 325.3 504 312L504 264L456 264C442.7 264 432 253.3 432 240C432 226.7 442.7 216 456 216L504 216L504 168C504 154.7 514.7 144 528 144zM256 312C189.7 312 136 258.3 136 192C136 125.7 189.7 72 256 72C322.3 72 376 125.7 376 192C376 258.3 322.3 312 256 312z" />
                            </svg>
                          </button>

                          {/* Bouton Editer */}
                          <button
                            type="button"
                            className="p-2 rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Éditer"
                            onClick={() => openEditModal(u)}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>

                          {/* Bouton Supprimer */}
                          <button
                            type="button"
                            className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                            onClick={() => {
                              setDeleteModalOpen(true);
                              setDeletePlayerId(u.id);
                              setDeletePlayerLabel(u.pseudo);
                              setDeleteError(null);
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
            <button
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              ← Précédent
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODALE : CREATION / EDITION (Style LoginForm)
          ========================================== */}
      {playerModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={closePlayerModal}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95">
            <h2 className="mb-6 font-Montserrat text-xl font-bold text-slate-800">
              {playerModalMode === "create"
                ? "Ajouter un joueur"
                : "Modifier le joueur"}
            </h2>

            <form
              className="flex flex-col gap-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setPlayerModalError(null);
                setIsSavingPlayer(true);

                try {
                  if (playerModalMode === "create") {
                    await postJson(
                      "/players",
                      {
                        pseudo: playerPseudo,
                        email: playerEmail,
                        phone: playerPhone,
                      },
                      { auth: true },
                    );
                  } else {
                    await patchJson(
                      `/players/${playerModalId}`,
                      {
                        pseudo: playerPseudo,
                        email: playerEmail,
                        phone: playerPhone,
                      },
                      { auth: true },
                    );
                  }
                  setRefreshKey((k) => k + 1);
                  closePlayerModal();
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : "SAVE_FAILED";
                  setPlayerModalError(message);
                  unauthorizedToHome(message);
                } finally {
                  setIsSavingPlayer(false);
                }
              }}
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pseudo
                </label>
                <input
                  type="text"
                  className="w-full border-b border-slate-300 bg-transparent py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                  value={playerPseudo}
                  onChange={(e) => setPlayerPseudo(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border-b border-slate-300 bg-transparent py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="w-full border-b border-slate-300 bg-transparent py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  required
                />
              </div>

              {playerModalError && (
                <p className="text-center text-xs text-red-500 mt-2">
                  {playerModalError === "EMAIL_ALREADY_USED"
                    ? "Cet email est déjà utilisé."
                    : `Erreur: ${playerModalError}`}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-100 transition-colors"
                  onClick={closePlayerModal}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: selectedGame.mainColor }}
                  disabled={isSavingPlayer}
                >
                  {isSavingPlayer ? "..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALE : SUPPRESSION
          ========================================== */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center animate-in zoom-in-95">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="mb-2 font-Montserrat text-xl font-bold text-slate-800">
              Supprimer le joueur
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-bold text-slate-800">
                {deletePlayerLabel}
              </span>{" "}
              ? Cette action est irréversible.
            </p>

            {deleteError && (
              <p className="text-xs text-red-500 mb-4">
                {deleteError === "NOT_FOUND"
                  ? "Joueur introuvable"
                  : `Erreur: ${deleteError}`}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-100 transition-colors"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
                onClick={async () => {
                  if (!deletePlayerId) return;
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    await deleteJson(`/players/${deletePlayerId}`, {
                      auth: true,
                    });
                    setDeleteModalOpen(false);
                    setRefreshKey((k) => k + 1);
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "DELETE_FAILED";
                    setDeleteError(message);
                    unauthorizedToHome(message);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALE : CONFIRMATION DECONNEXION
          ========================================== */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setLogoutModalOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8 animate-in zoom-in-95">
            <h2 className="mb-2 font-Montserrat text-xl font-bold text-slate-800">
              Confirmer la déconnexion
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Voulez-vous vraiment vous déconnecter ?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-100"
                onClick={() => setLogoutModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="w-1/2 rounded-full py-3 text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: selectedGame.mainColor }}
                onClick={() => {
                  setLogoutModalOpen(false);
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
