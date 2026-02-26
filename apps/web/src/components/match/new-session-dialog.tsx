"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import type { Id } from "@paddlerino/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Player {
  _id: Id<"players">;
  name: string;
}

interface NewSessionDialogProps {
  matchId: Id<"matches">;
  players: Player[];
  disabled: boolean;
}

export default function NewSessionDialog({
  matchId,
  players,
  disabled,
}: NewSessionDialogProps) {
  const createSession = useMutation(api.sessions.create);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  function togglePlayer(playerId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(players.map((p) => p._id)));
  }

  const canStart = selected.size >= 2;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (open) selectAll();
      }}
    >
      <DialogTrigger render={<Button size="sm" disabled={disabled} />}>
        <PlusIcon />
        New Session
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>
            Select the players for this session.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-2">
            {players.map((player) => (
              <button
                key={player._id}
                onClick={() => togglePlayer(player._id)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <Checkbox checked={selected.has(player._id)} />
                <span className="font-medium">{player.name}</span>
              </button>
            ))}
          </div>
        </DialogPanel>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleStart} disabled={!canStart}>
            Start Session
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );

  async function handleStart() {
    const playerIds = Array.from(selected) as Id<"players">[];
    try {
      await createSession({ matchId, playerIds });
      setDialogOpen(false);
      setSelected(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create session",
      );
    }
  }
}
