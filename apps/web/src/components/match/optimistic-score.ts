import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";

function updateActiveSessionPlayerScore(
  localStore: OptimisticLocalStore,
  sessionPlayerId: Id<"sessionPlayers">,
  getNextScore: (currentScore: number) => number,
) {
  for (const queryResult of localStore.getAllQueries(api.sessions.getActive)) {
    const session = queryResult.value;
    if (session === undefined || session === null) continue;

    let didUpdate = false;
    const nextPlayerScores = session.playerScores.map((playerScore) => {
      if (playerScore._id !== sessionPlayerId) return playerScore;
      didUpdate = true;
      return {
        ...playerScore,
        score: getNextScore(playerScore.score),
      };
    });

    if (!didUpdate) continue;

    localStore.setQuery(api.sessions.getActive, queryResult.args, {
      ...session,
      playerScores: nextPlayerScores,
    });
  }
}

export function optimisticallyApplyScoreDelta(
  localStore: OptimisticLocalStore,
  args: { sessionPlayerId: Id<"sessionPlayers">; delta: number },
) {
  updateActiveSessionPlayerScore(
    localStore,
    args.sessionPlayerId,
    (currentScore) => Math.max(0, currentScore + args.delta),
  );
}

export function optimisticallySetScore(
  localStore: OptimisticLocalStore,
  args: { sessionPlayerId: Id<"sessionPlayers">; score: number },
) {
  const normalizedScore = Math.max(0, Math.trunc(args.score));
  updateActiveSessionPlayerScore(
    localStore,
    args.sessionPlayerId,
    () => normalizedScore,
  );
}
