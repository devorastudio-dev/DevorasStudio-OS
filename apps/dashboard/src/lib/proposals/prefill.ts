type ClientOption = { id: string };
type OpportunityLink = { client_id: string; opportunity_id: string };

export function resolveProposalPrefill(
  requested: { client?: string; opportunity?: string },
  clients: ClientOption[],
  links: OpportunityLink[],
) {
  const opportunityLink = requested.opportunity
    ? links.find((link) => link.opportunity_id === requested.opportunity)
    : undefined;
  const linkedClient = opportunityLink
    ? clients.find((client) => client.id === opportunityLink.client_id)
    : undefined;
  const requestedClient = requested.client
    ? clients.find((client) => client.id === requested.client)
    : undefined;
  const clientId = linkedClient?.id ?? requestedClient?.id ?? "";
  const opportunityId =
    opportunityLink?.client_id === clientId
      ? opportunityLink.opportunity_id
      : "";

  return { clientId, opportunityId };
}
