import "server-only";

import { createClient } from "../supabase/server";
import {
  auditActionSchema,
  auditMetadataSchema,
  auditOutcomeSchema,
  type AuditAction,
  type AuditOutcome,
} from "./catalog";

export async function recordAuditEvent(input: {
  action: AuditAction;
  entityId?: string;
  entityType?: string;
  metadata?: unknown;
  outcome: AuditOutcome;
  requestId?: string;
}) {
  const action = auditActionSchema.parse(input.action);
  const outcome = auditOutcomeSchema.parse(input.outcome);
  const metadata = auditMetadataSchema.parse(input.metadata ?? {});
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_audit_event", {
    event_action: action,
    event_entity_id: input.entityId,
    event_entity_type: input.entityType,
    event_metadata: metadata,
    event_outcome: outcome,
    event_request_id: input.requestId,
  });
  if (error) throw new Error("Nao foi possivel registrar a auditoria.");
}
