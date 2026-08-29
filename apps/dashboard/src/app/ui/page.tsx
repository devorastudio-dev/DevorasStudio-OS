import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  Textarea,
} from "@devora/ui";

import { requireDashboardAccess } from "../../lib/auth/access";

export const dynamic = "force-dynamic";

export default async function UiShowcase() {
  await requireDashboardAccess();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-10 text-text sm:px-6 lg:px-8">
      <div className="mx-auto flex min-w-0 max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <Badge variant="info">Ambiente de desenvolvimento</Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Base visual compartilhada
          </h1>
          <p className="max-w-2xl text-text-muted">
            Demonstração técnica dos componentes usados por marketing e
            dashboard.
          </p>
        </header>

        <Card className="min-w-0 space-y-5">
          <h2 className="text-xl font-bold">Ações</h2>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto">Primário</Button>
            <Button className="w-full sm:w-auto" variant="secondary">
              Secundário
            </Button>
            <Button className="w-full sm:w-auto" variant="ghost">
              Discreto
            </Button>
            <Button className="w-full sm:w-auto" variant="danger">
              Perigo
            </Button>
            <Button className="w-full sm:w-auto" disabled>
              Desabilitado
            </Button>
            <Button aria-label="Salvando" className="w-full sm:w-auto" disabled>
              <Spinner label="Salvando" />
              Salvando
            </Button>
          </div>
        </Card>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <Card className="min-w-0 space-y-5">
            <h2 className="text-xl font-bold">Campos</h2>
            <div>
              <Label htmlFor="dashboard-name">Nome</Label>
              <Input id="dashboard-name" placeholder="Nome da pessoa" />
            </div>
            <div>
              <Label htmlFor="dashboard-email">E-mail inválido</Label>
              <Input
                aria-describedby="dashboard-email-error"
                aria-invalid="true"
                id="dashboard-email"
                type="email"
                value="email-invalido"
                readOnly
              />
              <p className="mt-2 text-sm text-error" id="dashboard-email-error">
                Informe um endereço de e-mail válido.
              </p>
            </div>
            <div>
              <Label htmlFor="dashboard-message">Mensagem</Label>
              <Textarea
                id="dashboard-message"
                placeholder="Escreva uma mensagem"
              />
            </div>
          </Card>

          <Card className="min-w-0 space-y-5">
            <h2 className="text-xl font-bold">Estados</h2>
            <div className="flex flex-wrap gap-2">
              <Badge>Neutro</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="error">Erro</Badge>
              <Badge variant="info">Informação</Badge>
            </div>
            <Alert variant="success">
              <strong>Sucesso:</strong> alterações salvas.
            </Alert>
            <Alert variant="warning">
              <strong>Aviso:</strong> revise os dados.
            </Alert>
            <Alert variant="error">
              <strong>Erro:</strong> não foi possível concluir.
            </Alert>
            <Alert>
              <strong>Informação:</strong> nenhum dado real é exibido aqui.
            </Alert>
          </Card>
        </div>
      </div>
    </main>
  );
}
