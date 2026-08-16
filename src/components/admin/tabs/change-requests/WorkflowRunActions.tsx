"use client";
import React from "react";

interface WorkflowRunActionsProps {
  selectedWorkflowRun: any;
  transitionChangeRequest: any;
  startImplementationChangeRequest: any;
  deleteChangeRequest: any;
  handleStartImplementation: (id: string, status: string) => void | Promise<void>;
  handleTransition: (id: string, action: string, status: string) => void | Promise<void>;
}

/**
 * Toolbar of run-control buttons inside the workflow run detail panel.
 * Extracted from `WorkflowRunDetailPanel` to keep it under 300 LOC.
 */
export function WorkflowRunActions({
  selectedWorkflowRun,
  transitionChangeRequest,
  startImplementationChangeRequest,
  deleteChangeRequest,
  handleStartImplementation,
  handleTransition,
}: WorkflowRunActionsProps) {
  const anyPending =
    transitionChangeRequest.isPending ||
    startImplementationChangeRequest.isPending ||
    deleteChangeRequest.isPending;
  const status = selectedWorkflowRun.item.status;
  const id = selectedWorkflowRun.item.id;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {(status === "submitted" ||
        status === "triaged" ||
        status === "planned") && (
        <button
          type="button"
          className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
          disabled={anyPending}
          onClick={() => void handleStartImplementation(id, status)}
        >
          relancer run
        </button>
      )}
      {(status === "in_progress" || status === "qa") && (
        <button
          type="button"
          className="rounded-md border border-[#4A3B1F] bg-[#2B2210] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
          disabled={anyPending}
          onClick={() => void handleTransition(id, "stop", status)}
        >
          stop run
        </button>
      )}
      {status !== "released" && status !== "rejected" && (
        <button
          type="button"
          className="rounded-md border border-[#5E4A20] bg-[#2B2413] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
          disabled={anyPending}
          onClick={() => void handleTransition(id, "cancel", status)}
        >
          cancel run
        </button>
      )}
      {(status === "in_progress" || status === "qa") && (
        <>
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
            disabled={anyPending}
            onClick={() =>
              void handleTransition(id, "execution_start", status)
            }
          >
            signaler start backend
          </button>
          <button
            type="button"
            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
            disabled={anyPending}
            onClick={() =>
              void handleTransition(id, "execution_heartbeat", status)
            }
          >
            heartbeat
          </button>
          <button
            type="button"
            className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
            disabled={anyPending}
            onClick={() =>
              void handleTransition(id, "execution_success", status)
            }
          >
            signaler success
          </button>
          <button
            type="button"
            className="rounded-md border border-[#5B1F27] bg-[#2B1419] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
            disabled={anyPending}
            onClick={() =>
              void handleTransition(id, "execution_fail", status)
            }
          >
            signaler échec
          </button>
        </>
      )}
    </div>
  );
}
