"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { LinkIcon, PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MatchHeaderProps {
  match: {
    _id: Id<"matches">;
    name: string;
    status: "active" | "completed";
    players: Array<{ _id: Id<"players">; name: string }>;
  };
}

export default function MatchHeader({ match }: MatchHeaderProps) {
  const addPlayer = useMutation(api.players.add);
  const removePlayer = useMutation(api.players.remove);
  const [playerName, setPlayerName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: match.name, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">{match.name}</h1>
        <Badge variant={match.status === "active" ? "success" : "secondary"}>
          {match.status}
        </Badge>
        <Button size="icon-sm" variant="outline" onClick={handleShare}>
          <LinkIcon />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {match.players.map((player) => (
          <Badge key={player._id} variant="outline" className="gap-1 pr-1">
            {player.name}
            <button
              onClick={async () => {
                try {
                  await removePlayer({ playerId: player._id });
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Failed to remove",
                  );
                }
              }}
              className="ml-0.5 rounded-sm p-0.5 opacity-60 hover:opacity-100"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="xs" variant="outline" />}>
            <PlusIcon />
            Add Player
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Add Player</DialogTitle>
            </DialogHeader>
            <DialogPanel>
              <div className="space-y-2">
                <Label htmlFor="player-name">Player name</Label>
                <Input
                  id="player-name"
                  placeholder="Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                />
              </div>
            </DialogPanel>
            <DialogFooter variant="bare">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleAdd} disabled={!playerName.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </div>
    </div>
  );

  async function handleAdd() {
    if (!playerName.trim()) return;
    try {
      await addPlayer({ matchId: match._id, name: playerName });
      setPlayerName("");
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add player",
      );
    }
  }
}
