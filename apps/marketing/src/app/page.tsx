import { ContactForm } from "./contact-form";

const services = [
  {
    number: "01",
    title: "Presença digital",
    description:
      "Estruturas digitais claras para apresentar seu negócio e facilitar novos contatos.",
    icon: "window",
  },
  {
    number: "02",
    title: "Sistemas para o negócio",
    description:
      "Soluções sob medida para organizar rotinas, informações e atendimento.",
    icon: "layers",
  },
  {
    number: "03",
    title: "Automações",
    description:
      "Integrações que reduzem tarefas repetitivas e aproximam ferramentas.",
    icon: "spark",
  },
] as const;

const processSteps = [
  ["Descoberta", "Contexto, prioridades e resultado esperado."],
  ["Direção", "Escopo claro e próximos passos compartilhados."],
  ["Construção", "Entrega incremental, validação e evolução."],
] as const;

function Brand() {
  return (
    <span className="brand-lockup" aria-label="Devora Studio">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        DEVORA <small>STUDIO</small>
      </span>
    </span>
  );
}

function ServiceIcon({ type }: { type: (typeof services)[number]["icon"] }) {
  if (type === "window")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
      </svg>
    );
  if (type === "layers")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function NavigationLinks() {
  return (
    <>
      <a href="#servicos">Serviços</a>
      <a href="#processo">Processo</a>
      <a href="#contato">Contato</a>
    </>
  );
}

export default function MarketingHome() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <a className="brand" href="#inicio">
          <Brand />
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <NavigationLinks />
          <a className="nav-cta" href="#contato">
            Iniciar conversa <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Abrir menu de navegação">
            <span />
            <span />
            <span />
          </summary>
          <nav aria-label="Navegação móvel">
            <NavigationLinks />
          </nav>
        </details>
      </header>

      <main id="conteudo">
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-glow hero-glow-primary" aria-hidden="true" />
          <div className="hero-glow hero-glow-accent" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" /> Tecnologia com propósito
            </p>
            <h1 id="hero-title">
              Soluções digitais pensadas para o seu <span>negócio.</span>
            </h1>
            <p className="hero-lead">
              Entendemos o contexto, organizamos o caminho e construímos
              tecnologia útil para a operação.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#contato">
                Conte seu desafio <span aria-hidden="true">→</span>
              </a>
              <a className="secondary-link" href="#servicos">
                Conheça as soluções
              </a>
            </div>
          </div>
          <div className="hero-panel" aria-label="Nosso ponto de partida">
            <div className="panel-top" aria-hidden="true">
              <span />
              <span />
              <span />
              <small>devora / projeto</small>
            </div>
            <p className="panel-label">Como começamos</p>
            <ol>
              {[
                ["Ouvir", "antes de propor."],
                ["Construir", "com clareza."],
                ["Evoluir", "com responsabilidade."],
              ].map(([title, text], index) => (
                <li key={title}>
                  <span>0{index + 1}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="section services-section"
          id="servicos"
          aria-labelledby="servicos-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Como podemos ajudar</p>
              <h2 id="servicos-title">
                Do problema à <span>solução digital.</span>
              </h2>
            </div>
            <p>
              Tecnologia deve simplificar o que importa. Cada solução parte do
              contexto do negócio e de um objetivo claro.
            </p>
          </div>
          <div className="cards">
            {services.map((service) => (
              <article key={service.title}>
                <div className="card-meta">
                  <span className="service-icon">
                    <ServiceIcon type={service.icon} />
                  </span>
                  <small>{service.number}</small>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#contato">
                  Conversar sobre isso <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section
          className="section process-section"
          id="processo"
          aria-labelledby="processo-title"
        >
          <div className="process-intro">
            <p className="eyebrow">Processo</p>
            <h2 id="processo-title">
              Trabalho próximo, <span>decisões transparentes.</span>
            </h2>
            <p>
              Um caminho simples para transformar contexto em uma solução que
              possa ser entendida, validada e evoluída.
            </p>
          </div>
          <ol className="process-list">
            {processSteps.map(([title, description], index) => (
              <li key={title}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="section contact"
          id="contato"
          aria-labelledby="contato-title"
        >
          <div className="contact-intro">
            <p className="eyebrow">Vamos conversar</p>
            <h2 id="contato-title">
              Qual desafio podemos <span>entender com você?</span>
            </h2>
            <p>
              Envie um breve contexto. A mensagem será usada somente para
              avaliar e responder ao contato.
            </p>
            <div className="contact-note">
              <span aria-hidden="true">↗</span>
              <p>
                <strong>Comece pelo contexto.</strong>Não precisa ter a solução
                pronta para iniciar a conversa.
              </p>
            </div>
          </div>
          <ContactForm />
        </section>
      </main>

      <footer>
        <a className="brand" href="#inicio">
          <Brand />
        </a>
        <span>© {new Date().getFullYear()} Devora Studio</span>
        <div>
          <a href="/privacy">Privacidade</a>
          <a href="https://app.devorastudio.com.br">Acesso interno</a>
        </div>
      </footer>
    </>
  );
}
