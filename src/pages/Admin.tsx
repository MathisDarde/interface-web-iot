import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteJson, getJson, patchJson, postJson } from "../api";
import { logout } from "../auth";
import gamesJson from "../_assets/games-data.json";
import type { Game } from "../../types/types";

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
  const value = localStorage.getItem(ADMIN_GAME_KEY);
  return value ? value : null;
}

function setStoredAdminGameName(gameName: string) {
  localStorage.setItem(ADMIN_GAME_KEY, gameName);
}

export function AdminPage() {
  const navigate = useNavigate();
  const games = gamesJson as unknown as Game[];

  const [gameName, setGameName] = useState<string>(() => {
    const stored = getStoredAdminGameName();
    return stored ?? games[0]?.name ?? "pokemon";
  });

  const selectedGame = useMemo(() => {
    return (
      games.find((g) => g.name.toLowerCase() === gameName.toLowerCase()) ??
      null
    );
  }, [gameName, games]);

  const [playerModalMode, setPlayerModalMode] = useState<ModalMode | null>(
    null,
  );
  const [playerModalId, setPlayerModalId] = useState<string | null>(null);
  const [playerPseudo, setPlayerPseudo] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [playerModalError, setPlayerModalError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePlayerId, setDeletePlayerId] = useState<string | null>(null);
  const [deletePlayerLabel, setDeletePlayerLabel] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PlayersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [nfcStatus, setNfcStatus] = useState<NfcStatus>("idle");
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);

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
    // 1. Vérifier si le navigateur supporte le NFC
    const NDEFReaderCtor = (window as unknown as WindowWithNdef).NDEFReader;
    if (!NDEFReaderCtor) {
      alert(
        "Le NFC n'est pas supporté par ce navigateur (essayez Chrome sur Android).",
      );
      return;
    }

    try {
      setNfcStatus("scanning");
      setNfcMessage(`Approchez la carte pour enregistrer ${player.pseudo}...`);

      const ndef = new NDEFReaderCtor();

      // On lance l'écriture
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
                version: "1.0",
              }),
            ),
          },
        ],
      });

      setNfcStatus("success");
      setNfcMessage("✅ Carte encodée avec succès !");

      // Réinitialiser le message après 3 secondes
      setTimeout(() => {
        setNfcStatus("idle");
        setNfcMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Erreur NFC:", error);
      setNfcStatus("error");
      setNfcMessage("❌ Échec de l'écriture. Réessayez.");

      setTimeout(() => {
        setNfcStatus("idle");
        setNfcMessage(null);
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen max-w-6xl w-full mx-auto p-8">
      {nfcStatus !== "idle" && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-100 px-6 py-3 rounded-full shadow-lg border text-white font-bold animate-bounce ${
            nfcStatus === "scanning"
              ? "bg-blue-600"
              : nfcStatus === "success"
                ? "bg-green-600"
                : "bg-red-600"
          }`}
        >
          {nfcMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mt-6">
        <button
          type="button"
          className="absolute top-3 right-5 text-blue-500 hover:underline transition-all font-Lato"
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          Déconnexion
        </button>

        <h1 className="font-Montserrat font-bold text-2xl">Liste des joueurs</h1>

        <div className="flex items-center gap-3">
          <label className="font-Lato">Jeu</label>
          <select
            className="border px-3 py-2 rounded-lg font-Lato"
            value={selectedGame?.name ?? gameName}
            onChange={(e) => {
              const next = e.target.value;
              setGameName(next);
              setStoredAdminGameName(next);
            }}
          >
            {games.map((g) => (
              <option key={g.id} value={g.name}>
                {g.displayName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="px-4 py-2 rounded-lg border font-Lato flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: selectedGame?.mainColor ?? "#E01E28" }}
          onClick={openCreateModal}
        >
          <img
            src={selectedGame?.iconImage ?? "/img/icons/pokeball.png"}
            alt="Game icon"
          />
          <span>Ajouter un joueur</span>
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <label className="font-Lato">Rechercher un joueur</label>

        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            width="20px"
            height="20px"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
          </svg>
          <input
            type="text"
            className="border pl-12 py-2 rounded-lg w-full"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par pseudo, email ou numéro de téléphone"
          />
        </div>
      </div>

      <div className="mt-6">
        {error && (
          <p className="text-red-600 text-sm font-Lato">
            {error === "UNAUTHORIZED" ? "Session expirée" : `Erreur: ${error}`}
          </p>
        )}

        <div className="overflow-x-auto mt-3 rounded-md">
          <table className="w-full border-collapse ">
            <thead>
              <tr
                className="text-left text-white"
                style={{ backgroundColor: selectedGame?.mainColor ?? "#E01E28" }}
              >
                <th className="border-b px-4 py-2 font-Lato">Pseudo</th>
                <th className="border-b px-4 py-2 font-Lato">Email</th>
                <th className="border-b px-4 py-2 font-Lato">Téléphone</th>
                <th className="border-b px-4 py-2 font-Lato">Créé le</th>
                <th className="border-b px-4 py-2 font-Lato text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="py-3 font-Lato" colSpan={5}>
                    Chargement...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="py-3 font-Lato" colSpan={5}>
                    Aucun joueur
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id}>
                    <td className="border-b px-4 py-2 font-Lato">{u.pseudo}</td>
                    <td className="border-b px-4 py-2 font-Lato">{u.email}</td>
                    <td className="border-b px-4 py-2 font-Lato">{u.phone}</td>
                    <td className="border-b px-4 py-2 font-Lato">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="border-b px-4 py-2 font-Lato">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className={`p-1 cursor-pointer hover:scale-110 transition-transform ${nfcStatus === "scanning" ? "opacity-30" : ""}`}
                          title="Écrire sur carte NFC"
                          disabled={nfcStatus === "scanning"}
                          onClick={() => handleNfcWrite(u)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            className={`size-5 ${nfcStatus === "scanning" ? "fill-blue-500" : "fill-current"}`}
                          >
                            <path d="M285.7 368C384.2 368 464 447.8 464 546.3C464 562.7 450.7 576 434.3 576L77.7 576C61.3 576 48 562.7 48 546.3C48 447.8 127.8 368 226.3 368L285.7 368zM528 144C541.3 144 552 154.7 552 168L552 216L600 216C613.3 216 624 226.7 624 240C624 253.3 613.3 264 600 264L552 264L552 312C552 325.3 541.3 336 528 336C514.7 336 504 325.3 504 312L504 264L456 264C442.7 264 432 253.3 432 240C432 226.7 442.7 216 456 216L504 216L504 168C504 154.7 514.7 144 528 144zM256 312C189.7 312 136 258.3 136 192C136 125.7 189.7 72 256 72C322.3 72 376 125.7 376 192C376 258.3 322.3 312 256 312z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          title="Éditer"
                          onClick={() => openEditModal(u)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            className="size-5"
                          >
                            <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="p-1 cursor-pointer"
                          title="Supprimer"
                          onClick={() => {
                            setDeleteModalOpen(true);
                            setDeletePlayerId(u.id);
                            setDeletePlayerLabel(u.pseudo);
                            setDeleteError(null);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            className="size-5"
                          >
                            <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
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

        <div className="mt-4 flex items-center justify-between max-w-md mx-auto">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border font-Lato disabled:opacity-60"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            Précédent
          </button>

          <span className="font-Lato">
            Page {page} / {totalPages}
          </span>

          <button
            type="button"
            className="px-4 py-2 rounded-lg border font-Lato disabled:opacity-60"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Suivant
          </button>
        </div>
      </div>

      {playerModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closePlayerModal}
          />

          <div className="relative bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-Montserrat font-bold text-xl">
                {playerModalMode === "create"
                  ? "Ajouter un joueur"
                  : "Éditer le joueur"}
              </h2>
              <button
                type="button"
                className="px-2 py-1 rounded-lg border font-Lato"
                onClick={closePlayerModal}
              >
                Fermer
              </button>
            </div>

            <form
              className="mt-4 flex flex-col gap-4"
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
              <div className="flex flex-col gap-2">
                <label className="font-Lato">Pseudo</label>
                <input
                  type="text"
                  className="border px-4 py-2 rounded-lg"
                  value={playerPseudo}
                  onChange={(e) => setPlayerPseudo(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-Lato">Email</label>
                <input
                  type="email"
                  className="border px-4 py-2 rounded-lg"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-Lato">Téléphone</label>
                <input
                  type="tel"
                  className="border px-4 py-2 rounded-lg"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  required
                />
              </div>

              {playerModalError && (
                <p className="text-red-600 text-sm font-Lato">
                  {playerModalError === "EMAIL_ALREADY_USED"
                    ? "Cet email est déjà utilisé"
                    : `Erreur: ${playerModalError}`}
                </p>
              )}

              <button
                type="submit"
                className="px-4 py-2 rounded-lg border font-Lato disabled:opacity-60"
                disabled={isSavingPlayer}
              >
                {isSavingPlayer ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (isDeleting) return;
              setDeleteModalOpen(false);
            }}
          />

          <div className="relative bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-Montserrat font-bold text-xl">
                Supprimer le joueur
              </h2>
              <button
                type="button"
                className="px-2 py-1 rounded-lg border font-Lato disabled:opacity-60"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Fermer
              </button>
            </div>

            <p className="mt-4 font-Lato">
              Confirmer la suppression de{" "}
              <span className="font-bold">{deletePlayerLabel}</span> ?
            </p>

            {deleteError && (
              <p className="text-red-600 text-sm font-Lato mt-2">
                {deleteError === "NOT_FOUND"
                  ? "Joueur introuvable"
                  : `Erreur: ${deleteError}`}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border font-Lato disabled:opacity-60"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-lg border font-Lato disabled:opacity-60"
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
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
