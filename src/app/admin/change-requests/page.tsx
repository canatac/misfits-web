"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

type RequestStatus = "draft" | "queued" | "running" | "completed" | "failed";

type ChangeRequest = {
  id: string;
  title: string;
  objective: string;
  plan: string;
  tasks: string;
  createdAt: string;
  status: RequestStatus;
  runId: string | null;
  latestOutput: string | null;
  error: string | null;
};

type RunResponse = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: unknown;
  error?: { message?: string } | string;
};

const STORAGE_KEY = "admin-change-requests-v1";

function toStatus(value: string | undefined): RequestStatus {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "completed") return "completed";
  if (normalized === "failed" || normalized === "cancelled" || normalized === "expired") {
    return "failed";
  }
  if (normalized === "in_progress" || normalized === "running") return "running";
  if (normalized === "queued") return "queued";
  return "running";
}

function extractOutputText(payload: RunResponse): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = payload.output as any;
  if (Array.isArray(output)) {
    const chunks: string[] = [];
    for (const item of output) {
      if (typeof item?.text === "string") chunks.push(item.text);
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === "string") chunks.push(content.text);
        }
      }
    }
    const merged = chunks.join("\n").trim();
    if (merged) return merged;
  }

  return null;
}

function buildInstruction(req: ChangeRequest): string {
  return [
    "Contexte: exécution admin séparée de l'interface chat mail.",
    `Titre: ${req.title}`,
    `Objectif: ${req.objective || "(non précisé)"}`,
    "Plan proposé:",
    req.plan || "(non précisé)",
    "Tâches:",
    req.tasks || "(non précisées)",
    "Attendu: proposer puis exécuter les actions concrètes nécessaires, avec statut final clair: COMPLET ou BLOQUÉ.",
  ].join("\n\n");
}

export default function AdminChangeRequestsPage() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [plan, setPlan] = useState("");
  const [tasks, setTasks] = useState("");
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChangeRequest[];
      if (Array.isArray(parsed)) setRequests(parsed);
    } catch {
      // ignore storage parse errors
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const running = useMemo(
    () => requests.filter((r) => r.runId && (r.status === "queued" || r.status === "running")),
    [requests],
  );

  useEffect(() => {
    if (running.length === 0) return;

    const timer = window.setInterval(async () => {
      for (const req of running) {
        if (!req.runId) continue;
        try {
          const res = await fetch(`/api/hermes/runs/${encodeURIComponent(req.runId)}`, {
            cache: "no-store",
          });
          const json = (await res.json()) as RunResponse;
          if (!res.ok) {
            const msg =
              (json as any)?.error?.message ||
              (typeof (json as any)?.error === "string" ? (json as any).error : "run fetch failed");
            setRequests((prev) =>
              prev.map((item) =>
                item.id === req.id
                  ? { ...item, status: "failed", error: String(msg), latestOutput: item.latestOutput }
                  : item,
              ),
            );
            continue;
          }

          const nextStatus = toStatus(json.status);
          const output = extractOutputText(json);

          setRequests((prev) =>
            prev.map((item) =>
              item.id === req.id
                ? {
                    ...item,
                    status: nextStatus,
                    latestOutput: output || item.latestOutput,
                    error: nextStatus === "failed" ? String((json.error as any)?.message || json.error || "failed") : null,
                  }
                : item,
            ),
          );
        } catch {
          // transient, keep previous state
        }
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [running]);

  const createRequest = useCallback(() => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const item: ChangeRequest = {
      id: `cr_${Date.now()}`,
      title: title.trim(),
      objective: objective.trim(),
      plan: plan.trim(),
      tasks: tasks.trim(),
      createdAt: now,
      status: "draft",
      runId: null,
      latestOutput: null,
      error: null,
    };

    setSaving(true);
    setRequests((prev) => [item, ...prev]);
    setTitle("");
    setObjective("");
    setPlan("");
    setTasks("");
    setSaving(false);
  }, [title, objective, plan, tasks]);

  const executeRequest = useCallback(
    async (item: ChangeRequest) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, status: "queued", error: null, latestOutput: null } : r,
        ),
      );

      try {
        const res = await fetch("/api/hermes/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: buildInstruction(item),
            model: "hermes-agent",
            sessionId: `admin-cr-${item.id}`,
            sessionKey: userId ? `user-${userId}` : "admin",
            userId: userId ?? "admin",
          }),
        });

        const json = (await res.json()) as RunResponse;
        if (!res.ok) {
          const msg =
            (json as any)?.error?.message ||
            (typeof (json as any)?.error === "string" ? (json as any).error : "execution failed");
          setRequests((prev) =>
            prev.map((r) =>
              r.id === item.id ? { ...r, status: "failed", error: String(msg) } : r,
            ),
          );
          return;
        }

        setRequests((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  runId: json.id || null,
                  status: toStatus(json.status),
                  latestOutput: extractOutputText(json),
                }
              : r,
          ),
        );
      } catch {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, status: "failed", error: "request error" } : r,
          ),
        );
      }
    },
    [userId],
  );

  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <section className="space-y-4">
      <header className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs">
          <ClipboardList className="h-3.5 w-3.5" />
          Change Requests
        </div>
        <h1 className="text-2xl font-bold">Change Requests Admin</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Pilotage IA séparé du chat mail: plan, tâches et exécution suivie par run.
        </p>
      </header>

      <article className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="text-base font-semibold">Nouveau change request</h2>
        <input
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Titre (ex: Refonte du panneau Monitoring)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="min-h-[72px] w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Objectif"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />
        <textarea
          className="min-h-[96px] w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        />
        <textarea
          className="min-h-[96px] w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          placeholder="Tâches (une ligne = une tâche)"
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
        />
        <div>
          <Button size="sm" onClick={createRequest} disabled={!title.trim() || saving}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Créer brouillon
          </Button>
        </div>
      </article>

      <article className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="text-base font-semibold">Demandes</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-fg)]">Aucune demande pour l’instant.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-[var(--color-border)] px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-xs text-[var(--color-muted-fg)]">
                      {new Date(item.createdAt).toLocaleString("fr-FR")} · statut: {item.status}
                      {item.runId ? ` · run: ${item.runId}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void executeRequest(item)}
                      disabled={item.status === "queued" || item.status === "running"}
                    >
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Exécuter IA
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRequest(item.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.objective && (
                  <p className="mt-2 text-sm text-[var(--color-muted-fg)]">{item.objective}</p>
                )}

                {item.error && (
                  <p className="mt-2 text-xs text-[var(--color-danger-500)]">Erreur: {item.error}</p>
                )}

                {item.latestOutput && (
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-2 text-xs">
                    {item.latestOutput}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </article>

      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">
            Retour Admin
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
