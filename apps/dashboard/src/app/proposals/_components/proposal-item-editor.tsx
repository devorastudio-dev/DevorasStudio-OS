"use client";

import { Alert, Button, Input, Label, Textarea } from "@devora/ui";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveProposalItem } from "../../../lib/proposals/actions";
import { SERVICE_UNITS, unitLabels } from "../../../lib/proposals/validation";

export type EditableProposalItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: (typeof SERVICE_UNITS)[number];
  unit_price: number;
  service_id: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  );
}

export function ProposalItemEditor({
  proposalId,
  item,
  canEdit,
  hasError = false,
}: Readonly<{
  proposalId: string;
  item: EditableProposalItem;
  canEdit: boolean;
  hasError?: boolean;
}>) {
  const [editing, setEditing] = useState(false);

  if (!canEdit) return null;

  if (!editing) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => setEditing(true)}
      >
        Editar
      </Button>
    );
  }

  return (
    <form action={saveProposalItem} className="crm-form proposal-item-editor">
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="itemId" value={item.id} />
      {/* A edição preserva service_id no banco e altera somente o snapshot. */}
      <input type="hidden" name="serviceId" value="" />
      {hasError ? (
        <Alert variant="error">
          Não foi possível salvar o item. Revise os campos e tente novamente.
        </Alert>
      ) : null}
      <div className="crm-field">
        <Label htmlFor={`item-name-${item.id}`}>Nome</Label>
        <Input
          id={`item-name-${item.id}`}
          name="name"
          defaultValue={item.name}
          minLength={2}
          maxLength={160}
          required
        />
      </div>
      <div className="crm-field">
        <Label htmlFor={`item-description-${item.id}`}>Descrição</Label>
        <Textarea
          id={`item-description-${item.id}`}
          name="description"
          defaultValue={item.description ?? ""}
          maxLength={2000}
        />
      </div>
      <div className="crm-field">
        <Label htmlFor={`item-quantity-${item.id}`}>Quantidade</Label>
        <Input
          id={`item-quantity-${item.id}`}
          name="quantity"
          type="number"
          min=".001"
          step=".001"
          defaultValue={item.quantity}
          required
        />
      </div>
      <div className="crm-field">
        <Label htmlFor={`item-unit-${item.id}`}>Unidade</Label>
        <select
          id={`item-unit-${item.id}`}
          name="unit"
          defaultValue={item.unit}
          required
        >
          {SERVICE_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unitLabels[unit]}
            </option>
          ))}
        </select>
      </div>
      <div className="crm-field">
        <Label htmlFor={`item-price-${item.id}`}>Preço unitário</Label>
        <Input
          id={`item-price-${item.id}`}
          name="unitPrice"
          type="number"
          min="0"
          step=".01"
          defaultValue={item.unit_price}
          required
        />
      </div>
      <div className="crm-inline-links proposal-item-editor-actions">
        <SaveButton />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
