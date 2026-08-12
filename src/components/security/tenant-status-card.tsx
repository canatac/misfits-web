import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TenantRemediationState } from "@/types/security";
import { formatIsoLocal } from "@/components/security/utils";

interface TenantStatusCardProps {
  tenantId: string;
  state: TenantRemediationState | null | undefined;
}

function statusClass(action: string | null | undefined): string {
  if (!action)
    return "bg-[var(--color-success-100)] text-[var(--color-success-800)]";
  if (action === "throttle")
    return "bg-[var(--color-warning-100)] text-[var(--color-warning-800)]";
  if (action === "quarantine" || action === "block")
    return "bg-[var(--color-danger-100)] text-[var(--color-danger-800)]";
  return "bg-[var(--color-muted)] text-[var(--color-muted-fg)]";
}

export function TenantStatusCard({ tenantId, state }: TenantStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Status</CardTitle>
        <CardDescription>
          Etat de remediation actif pour le tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!tenantId ? (
          <div className="text-sm text-[var(--color-muted-fg)]">
            Saisissez un tenant_id pour charger le statut.
          </div>
        ) : !state ? (
          <div className="inline-flex rounded-full bg-[var(--color-success-100)] px-3 py-1 text-sm text-[var(--color-success-800)]">
            Aucun statut actif
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div
              className={`inline-flex rounded-full px-3 py-1 font-medium ${statusClass(state.action)}`}
            >
              {state.action}
            </div>
            <div>
              <span className="text-[var(--color-muted-fg)]">Niveau:</span>{" "}
              {state.level}
            </div>
            <div>
              <span className="text-[var(--color-muted-fg)]">Reason:</span>{" "}
              {state.reason}
            </div>
            <div>
              <span className="text-[var(--color-muted-fg)]">Applied:</span>{" "}
              {formatIsoLocal(state.applied_at)}
            </div>
            <div>
              <span className="text-[var(--color-muted-fg)]">Expires:</span>{" "}
              {formatIsoLocal(state.expires_at)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
