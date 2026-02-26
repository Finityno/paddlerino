"use client";

import { api } from "@paddlerino/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center pt-12">
          <Spinner />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <AuthView />
      </Unauthenticated>
      <Authenticated>
        <MatchListView />
      </Authenticated>
    </>
  );
}

function AuthView() {
  const [showSignIn, setShowSignIn] = useState(true);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}

function MatchListView() {
  const matches = useQuery(api.matches.list);
  const createMatch = useMutation(api.matches.create);
  const [matchName, setMatchName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  if (matches === undefined) {
    return (
      <div className="flex justify-center pt-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matches</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="default" />}>
            <PlusIcon />
            New Match
          </DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>New Match</DialogTitle>
            </DialogHeader>
            <DialogPanel>
              <div className="space-y-2">
                <Label htmlFor="match-name">Match name</Label>
                <Input
                  id="match-name"
                  placeholder="Saturday Padel"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                />
              </div>
            </DialogPanel>
            <DialogFooter variant="bare">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleCreate} disabled={!matchName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </div>

      {matches.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>
              Create your first match to start tracking scores.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <Link key={match._id} href={`/match/${match._id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle>{match.name}</CardTitle>
                  <CardDescription>
                    {new Date(match.createdAt).toLocaleDateString()}
                  </CardDescription>
                  <CardAction>
                    <Badge
                      variant={
                        match.status === "active" ? "success" : "secondary"
                      }
                    >
                      {match.status}
                    </Badge>
                  </CardAction>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  async function handleCreate() {
    if (!matchName.trim()) return;
    try {
      await createMatch({ name: matchName });
      toast.success("Match created");
      setMatchName("");
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create match",
      );
    }
  }
}
