import "server-only";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { resolveProposalTokens } from "./document";
import type { ProposalSnapshot } from "./snapshot";

const colors = {
  accent: "#7c3aed",
  border: "#ddd6fe",
  foreground: "#1f2937",
  muted: "#6b7280",
  paper: "#ffffff",
  soft: "#f5f3ff",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.paper,
    color: colors.foreground,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingBottom: 52,
    paddingHorizontal: 44,
    paddingTop: 56,
  },
  cover: {
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    height: "100%",
    justifyContent: "center",
    padding: 58,
  },
  coverBrand: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2.4,
    marginBottom: 70,
  },
  coverLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1.8,
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 29,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 16,
    maxWidth: 420,
  },
  coverClient: { color: colors.muted, fontSize: 16, marginBottom: 52 },
  coverMeta: {
    borderLeftColor: colors.accent,
    borderLeftWidth: 3,
    gap: 5,
    paddingLeft: 14,
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.muted,
    flexDirection: "row",
    fontSize: 8,
    justifyContent: "space-between",
    left: 44,
    paddingBottom: 8,
    position: "absolute",
    right: 44,
    top: 25,
  },
  footer: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 22,
    color: colors.muted,
    flexDirection: "row",
    fontSize: 7.5,
    justifyContent: "space-between",
    left: 44,
    paddingTop: 7,
    position: "absolute",
    right: 44,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 5,
    orphans: 2,
    widows: 2,
  },
  investment: { marginTop: 6 },
  tableHeader: {
    backgroundColor: colors.soft,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    fontSize: 8,
    fontWeight: 700,
    padding: 7,
  },
  row: {
    borderBottomColor: "#ede9fe",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 30,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  item: { paddingRight: 8, width: "48%" },
  quantity: { textAlign: "right", width: "12%" },
  money: { textAlign: "right", width: "20%" },
  itemDescription: { color: colors.muted, fontSize: 7.5, marginTop: 3 },
  totals: { alignSelf: "flex-end", marginTop: 12, width: 210 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  grandTotal: {
    borderTopColor: colors.accent,
    borderTopWidth: 1,
    color: colors.accent,
    fontSize: 12,
    fontWeight: 700,
    paddingTop: 7,
  },
  signatures: { flexDirection: "row", gap: 28, marginTop: 54 },
  signature: {
    borderTopColor: colors.foreground,
    borderTopWidth: 1,
    paddingTop: 7,
    width: "45%",
  },
  attachment: { color: colors.muted, marginBottom: 4 },
});

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

function Header({
  document,
  version,
}: {
  document: ProposalSnapshot;
  version: number;
}) {
  return (
    <View fixed style={styles.header}>
      <Text>{document.organization.name}</Text>
      <Text>
        {document.proposal.number} · versão {version}
      </Text>
    </View>
  );
}

function Footer({ document }: { document: ProposalSnapshot }) {
  const contact = [
    document.organization.website,
    document.organization.email,
    document.organization.phone,
    document.organization.city,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View fixed style={styles.footer}>
      <Text>{contact || document.organization.name}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function ProposalPdfDocument({
  attachments = [],
  document,
  version,
}: {
  attachments?: Array<{ fileName: string }>;
  document: ProposalSnapshot;
  version: number;
}) {
  const visible = document.sections.filter(
    (section) =>
      section.visible && section.title.trim() && section.content.trim(),
  );
  return (
    <Document
      title={`${document.proposal.number} - versão ${version}`}
      author={document.organization.name}
      language="pt-BR"
    >
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverBrand}>
          {document.organization.name.toUpperCase()}
        </Text>
        <Text style={styles.coverLabel}>PROPOSTA COMERCIAL</Text>
        <Text style={styles.coverTitle}>{document.proposal.title}</Text>
        <Text style={styles.coverClient}>{document.client.name}</Text>
        <View style={styles.coverMeta}>
          <Text>{document.proposal.number}</Text>
          <Text>Versão {version}</Text>
          <Text>{date(document.proposal.createdAt)}</Text>
        </View>
      </Page>
      <Page size="A4" style={styles.page} wrap>
        <Header document={document} version={version} />
        <Footer document={document} />
        {visible.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {resolveProposalTokens(section.content, document)
              .value.split(/\r?\n/)
              .filter(Boolean)
              .map((line, index) => (
                <Text key={`${section.id}-${index}`} style={styles.paragraph}>
                  {line.replace(/^[-*]\s+/, "• ")}
                </Text>
              ))}
          </View>
        ))}
        <View style={[styles.section, styles.investment]}>
          <Text style={styles.sectionTitle}>Investimento</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.item}>Item</Text>
            <Text style={styles.quantity}>Qtd.</Text>
            <Text style={styles.money}>Unitário</Text>
            <Text style={styles.money}>Total</Text>
          </View>
          {document.items.map((item) => (
            <View key={item.id} style={styles.row} wrap={false}>
              <View style={styles.item}>
                <Text>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.money}>{money(item.unitPrice)}</Text>
              <Text style={styles.money}>{money(item.total)}</Text>
            </View>
          ))}
          <View style={styles.totals}>
            <View style={styles.totalLine}>
              <Text>Subtotal</Text>
              <Text>{money(document.proposal.subtotal)}</Text>
            </View>
            {document.proposal.discount ? (
              <View style={styles.totalLine}>
                <Text>Desconto</Text>
                <Text>{money(document.proposal.discount)}</Text>
              </View>
            ) : null}
            <View style={[styles.totalLine, styles.grandTotal]}>
              <Text>Total</Text>
              <Text>{money(document.proposal.total)}</Text>
            </View>
          </View>
        </View>
        {attachments.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anexos</Text>
            {attachments.map((attachment, index) => (
              <Text
                key={`${attachment.fileName}-${index}`}
                style={styles.attachment}
              >
                {index + 1}. {attachment.fileName}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signature}>
            <Text>{document.organization.name}</Text>
          </View>
          <View style={styles.signature}>
            <Text>{document.client.name}</Text>
          </View>
        </View>
        <Text
          style={[styles.paragraph, { color: colors.muted, marginTop: 12 }]}
        >
          Área destinada à formalização futura. Este documento não representa
          aceite eletrônico.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(
  input: Parameters<typeof ProposalPdfDocument>[0],
): Promise<Buffer> {
  return renderToBuffer(<ProposalPdfDocument {...input} />);
}

export function proposalPdfFilename(
  proposalNumber: string,
  version: number,
): string {
  const safe =
    proposalNumber
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "proposta";
  return `${safe}-v${version}-proposta.pdf`;
}
