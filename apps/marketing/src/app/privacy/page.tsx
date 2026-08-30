import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Devora Studio trata os dados enviados pelo formulário de contato.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link href="/">← Voltar ao início</Link>
      <h1>Política de Privacidade</h1>
      <p>Última atualização: agosto de 2026.</p>
      <h2>Dados coletados</h2>
      <p>
        Ao enviar o formulário, coletamos nome, e-mail, telefone e empresa
        quando informados, assunto, mensagem, origem da página e parâmetros UTM
        permitidos.
      </p>
      <h2>Finalidade e base</h2>
      <p>
        Usamos esses dados para receber, avaliar e responder ao seu pedido de
        contato, com base no consentimento registrado no envio.
      </p>
      <h2>Armazenamento e acesso</h2>
      <p>
        Os dados ficam no ambiente operacional da Devora Studio. O acesso é
        restrito a membros internos autorizados e protegidos por autenticação
        multifator e políticas de banco.
      </p>
      <h2>Compartilhamento e retenção</h2>
      <p>
        Não comercializamos esses dados. Prestadores de infraestrutura podem
        processá-los para operar o serviço. Mantemos as informações pelo tempo
        necessário ao atendimento e às obrigações aplicáveis, com revisão
        periódica.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação, acesso, correção ou eliminação quando
        aplicável. Use o próprio formulário da página inicial e identifique que
        o assunto é privacidade.
      </p>
      <h2>Segurança</h2>
      <p>
        Aplicamos controles técnicos e organizacionais proporcionais. Nenhum
        sistema é infalível; incidentes confirmados serão tratados conforme as
        obrigações aplicáveis.
      </p>
    </main>
  );
}
