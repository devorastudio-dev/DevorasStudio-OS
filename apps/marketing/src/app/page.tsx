import { ContactForm } from "./contact-form";

const services = [
  [
    "Presença digital",
    "Estruturas digitais claras para apresentar seu negócio e facilitar novos contatos.",
  ],
  [
    "Sistemas para o negócio",
    "Soluções sob medida para organizar rotinas, informações e atendimento.",
  ],
  [
    "Automações",
    "Integrações que reduzem tarefas repetitivas e aproximam ferramentas.",
  ],
] as const;

export default function MarketingHome() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Devora Studio, início">
          Devora Studio
        </a>
        <nav aria-label="Navegação principal">
          <a href="#servicos">Serviços</a>
          <a href="#processo">Processo</a>
          <a href="#contato">Contato</a>
        </nav>
      </header>
      <main id="conteudo">
        <section className="hero" id="inicio">
          <div>
            <p className="eyebrow">Tecnologia com propósito</p>
            <h1>Soluções digitais pensadas para o seu negócio.</h1>
            <p>
              Entendemos o contexto, organizamos o caminho e construímos
              tecnologia útil para a operação.
            </p>
            <a className="primary-link" href="#contato">
              Conte seu desafio
            </a>
          </div>
          <div className="hero-panel" aria-label="Nosso ponto de partida">
            <span>01</span>
            <p>Ouvir antes de propor.</p>
            <span>02</span>
            <p>Construir com clareza.</p>
            <span>03</span>
            <p>Evoluir com responsabilidade.</p>
          </div>
        </section>
        <section
          className="section"
          id="servicos"
          aria-labelledby="servicos-title"
        >
          <p className="eyebrow">Como podemos ajudar</p>
          <h2 id="servicos-title">Do problema à solução digital</h2>
          <div className="cards">
            {services.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          className="section split"
          id="processo"
          aria-labelledby="processo-title"
        >
          <div>
            <p className="eyebrow">Processo</p>
            <h2 id="processo-title">
              Trabalho próximo, decisões transparentes.
            </h2>
          </div>
          <ol>
            <li>
              <strong>Descoberta</strong>
              <span>Contexto, prioridades e resultado esperado.</span>
            </li>
            <li>
              <strong>Direção</strong>
              <span>Escopo claro e próximos passos compartilhados.</span>
            </li>
            <li>
              <strong>Construção</strong>
              <span>Entrega incremental, validação e evolução.</span>
            </li>
          </ol>
        </section>
        <section
          className="section contact"
          id="contato"
          aria-labelledby="contato-title"
        >
          <div>
            <p className="eyebrow">Vamos conversar</p>
            <h2 id="contato-title">Qual desafio podemos entender com você?</h2>
            <p>
              Envie um breve contexto. A mensagem será usada somente para
              avaliar e responder ao contato.
            </p>
          </div>
          <ContactForm />
        </section>
      </main>
      <footer>
        <span>© {new Date().getFullYear()} Devora Studio</span>
        <div>
          <a href="/privacy">Privacidade</a>
          <a href="https://app.devorastudio.com.br">Acesso interno</a>
        </div>
      </footer>
    </>
  );
}
