"use client";
// Hook façade pour ChangeRequestsTab.
//
// Le composant orchestrateur reçoit un contexte large (record open). Ce hook
// destructure les slices utilisées par les sous-composants et expose des
// groupes cohérents. Il ne détient PAS d'état local : tout l'état vient du
// parent (useAdminConsoleContext). Ce hook est un helper de compo pour
// éviter de propager 40+ props à chaque sous-composant.

import { useMemo } from "react";

export interface UseChangeRequestsTabContextReturn {
  monitoringProps: {
    changeRequestMonitoring: any;
    workflowRunMonitoring: any;
    observability: any;
    adminDataLoading: boolean;
    adminDataError: string | null | undefined;
  };
  runsListProps: {
    workflowRunMonitoring: any;
    selectedWorkflowRun: any;
    setSelectedRunId: (id: string) => void;
  };
  runDetailProps: {
    selectedWorkflowRun: any;
    selectedWorkflowRunEvents: any[];
    transitionChangeRequest: any;
    startImplementationChangeRequest: any;
    deleteChangeRequest: any;
    handleStartImplementation: (id: string, status: string) => void | Promise<void>;
    handleTransition: (id: string, action: string, status: string) => void | Promise<void>;
  };
  createFormProps: {
    newRequest: any;
    setNewRequest: (updater: (prev: any) => any) => void;
    createChangeRequest: any;
    qualityChecks: any;
    crGuideMessages: any[];
    crGuideInput: string;
    crGuideLoading: boolean;
    crGuideError: string | null | undefined;
    handleCreateChangeRequest: (e: React.FormEvent) => void;
    handleGuideChatSubmit: (e: React.FormEvent) => void;
    applyGuideToForm: () => void;
    setCrGuideInput: (v: string) => void;
  };
  deleteDialogProps: {
    deleteDialogTarget: any;
    setDeleteDialogTarget: (v: any) => void;
    deleteChangeRequest: any;
    handleDeleteChangeRequestConfirm: () => void | Promise<void>;
  };
  kanbanProps: {
    requestsByStatus: any;
    handleStartImplementation: any;
    handleTransition: any;
    openDeleteChangeRequestDialog: any;
    startImplementationChangeRequest: any;
    transitionChangeRequest: any;
    deleteChangeRequest: any;
  };
  header: {
    isFetching: boolean;
  };
  transitionNote: {
    value: string;
    setValue: (v: string) => void;
  };
}

export function useChangeRequestsTabContext(
  ctx: Record<string, any>
): UseChangeRequestsTabContextReturn {
  return useMemo(
    () => ({
      monitoringProps: {
        changeRequestMonitoring: ctx.changeRequestMonitoring,
        workflowRunMonitoring: ctx.workflowRunMonitoring,
        observability: ctx.observability,
        adminDataLoading: ctx.adminDataLoading,
        adminDataError: ctx.adminDataError,
      },
      runsListProps: {
        workflowRunMonitoring: ctx.workflowRunMonitoring,
        selectedWorkflowRun: ctx.selectedWorkflowRun,
        setSelectedRunId: ctx.setSelectedRunId,
      },
      runDetailProps: {
        selectedWorkflowRun: ctx.selectedWorkflowRun,
        selectedWorkflowRunEvents: ctx.selectedWorkflowRunEvents,
        transitionChangeRequest: ctx.transitionChangeRequest,
        startImplementationChangeRequest: ctx.startImplementationChangeRequest,
        deleteChangeRequest: ctx.deleteChangeRequest,
        handleStartImplementation: ctx.handleStartImplementation,
        handleTransition: ctx.handleTransition,
      },
      createFormProps: {
        newRequest: ctx.newRequest,
        setNewRequest: ctx.setNewRequest,
        createChangeRequest: ctx.createChangeRequest,
        qualityChecks: ctx.qualityChecks,
        crGuideMessages: ctx.crGuideMessages,
        crGuideInput: ctx.crGuideInput,
        crGuideLoading: ctx.crGuideLoading,
        crGuideError: ctx.crGuideError,
        handleCreateChangeRequest: ctx.handleCreateChangeRequest,
        handleGuideChatSubmit: ctx.handleGuideChatSubmit,
        applyGuideToForm: ctx.applyGuideToForm,
        setCrGuideInput: ctx.setCrGuideInput,
      },
      deleteDialogProps: {
        deleteDialogTarget: ctx.deleteDialogTarget,
        setDeleteDialogTarget: ctx.setDeleteDialogTarget,
        deleteChangeRequest: ctx.deleteChangeRequest,
        handleDeleteChangeRequestConfirm: ctx.handleDeleteChangeRequestConfirm,
      },
      kanbanProps: {
        requestsByStatus: ctx.requestsByStatus,
        handleStartImplementation: ctx.handleStartImplementation,
        handleTransition: ctx.handleTransition,
        openDeleteChangeRequestDialog: ctx.openDeleteChangeRequestDialog,
        startImplementationChangeRequest: ctx.startImplementationChangeRequest,
        transitionChangeRequest: ctx.transitionChangeRequest,
        deleteChangeRequest: ctx.deleteChangeRequest,
      },
      header: {
        isFetching: Boolean(ctx.changeRequests?.isFetching),
      },
      transitionNote: {
        value: ctx.transitionNote,
        setValue: ctx.setTransitionNote,
      },
    }),
    [ctx]
  );
}
