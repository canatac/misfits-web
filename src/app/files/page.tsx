"use client";

import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";
import { FileTree } from "./_components/FileTree";
import { RuleEditor } from "./_components/RuleEditor";
import { WorkspaceHeader } from "./_components/WorkspaceHeader";
import { useFileWorkspace } from "./_hooks/use-file-workspace";

export default function FilesPage() {
  const {
    loading,
    error,
    emails,
    grouping,
    setGrouping,
    scope,
    setScope,
    expanded,
    toggleExpanded,
    rules,
    setRules,
    workflowStatus,
    runningWorkflow,
    load,
    tree,
    fileCount,
    runWorkflow,
  } = useFileWorkspace();

  return (
    <NovamailWorkspaceShell>
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#242427] bg-[#121214] p-5">
        <WorkspaceHeader
          loading={loading}
          onReload={() => void load()}
          grouping={grouping}
          onGroupingChange={setGrouping}
          scope={scope}
          onScopeChange={setScope}
          emailsCount={emails.length}
          fileCount={fileCount}
        />

        <RuleEditor
          rules={rules}
          onChange={setRules}
          onRun={() => void runWorkflow()}
          running={runningWorkflow}
          status={workflowStatus}
        />

        {error ? <div className="mb-3 text-sm text-red-400">{error}</div> : null}

        <div className="max-h-[70vh] overflow-auto rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
          <FileTree node={tree} expanded={expanded} onToggle={toggleExpanded} />
        </div>
      </div>
    </NovamailWorkspaceShell>
  );
}
