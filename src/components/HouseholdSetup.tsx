"use client";

import { useState } from "react";
import { usePantryStore } from "@/store/usePantryStore";

export default function HouseholdSetup() {
  const { user, createHousehold, joinHousehold, signOut } = usePantryStore();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createHousehold(name.trim());
    } catch {
      setError("Failed to create household");
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const success = await joinHousehold(inviteCode.trim());
      if (!success) {
        setError("Invalid invite code. Check and try again.");
      }
    } catch {
      setError("Failed to join household");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <span className="text-5xl mb-3">🏠</span>
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Welcome, {user?.displayName?.split(" ")[0]}!
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        Set up your household to start tracking your pantry.
      </p>

      {mode === "choose" && (
        <div className="w-full max-w-[300px] flex flex-col gap-3">
          <button
            onClick={() => setMode("create")}
            className="w-full h-12 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all"
          >
            Create a Household
          </button>
          <button
            onClick={() => setMode("join")}
            className="w-full h-12 border border-border text-sm font-medium text-text-primary rounded-[var(--radius-md)] hover:bg-bg-secondary active:scale-[0.98] transition-all"
          >
            Join with Invite Code
          </button>
          <button
            onClick={signOut}
            className="text-xs text-text-tertiary hover:text-text-secondary mt-2"
          >
            Sign out
          </button>
        </div>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="w-full max-w-[300px]">
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary block mb-1.5 text-left">
              Household Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Holloways"
              autoFocus
              required
              className="w-full h-11 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-40 mb-3"
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("choose"); setError(null); }}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Back
          </button>
          {error && <p className="text-xs text-stock-critical mt-3">{error}</p>}
        </form>
      )}

      {mode === "join" && (
        <form onSubmit={handleJoin} className="w-full max-w-[300px]">
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary block mb-1.5 text-left">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3K7M2"
              autoFocus
              required
              maxLength={6}
              className="w-full h-11 px-3 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-center tracking-[0.3em] font-mono text-lg"
            />
          </div>
          <button
            type="submit"
            disabled={inviteCode.length < 6 || loading}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all disabled:opacity-40 mb-3"
          >
            {loading ? "Joining..." : "Join Household"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("choose"); setError(null); }}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Back
          </button>
          {error && <p className="text-xs text-stock-critical mt-3">{error}</p>}
        </form>
      )}
    </div>
  );
}
