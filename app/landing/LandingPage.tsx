import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Homologación de Empresas',
    image: 'https://ayf.pe/wp-content/uploads/2020/07/homologación-de-empresas_sevicio.webp',
    text: 'Tiene como finalidad evaluar de manera técnica, independiente, imparcial y objetiva el nivel de cumplimiento de las empresas proveedoras de nuestros Clientes, verificando que cuenten con las capacidades necesarias para cumplir sus obligaciones al menor riesgo posible.',
  },
  {
    title: 'Sistemas de Gestión',
    image: 'https://ayf.pe/wp-content/uploads/2020/07/sistemas-de-gestión.webp',
    text: 'A&F cuenta con especialistas para diagnosticar los procesos de la empresa y proponer el desarrollo e implementación de requisitos alineados al Sistema de Gestión que deseen implementar.',
  },
  {
    title: 'Desarrollo de Planes de Negocio',
    image: 'https://ayf.pe/wp-content/uploads/2020/07/Desarrollo-de-planes-de-negocio.webp',
    text: 'Ofrecemos herramientas y modelos de gestión personalizados para desarrollar un Plan Estratégico confiable y sostenible, mantenerse competitivos y generar valor.',
  },
  {
    title: 'Bolsa de Proveedores',
    image: 'https://ayf.pe/wp-content/uploads/2020/07/bolsa-de-proveedores.webp',
    text: 'A&F cuenta con una base de datos de empresas homologadas para apoyar las necesidades de abastecimiento de bienes y servicios con empresas calificadas.',
  },
];

function LandingPage() {
  return (
    <div className="corporate-site">
      <header className="corporate-header">
        <a className="corporate-logo" href="#inicio" aria-label="A&F Servicios Empresariales">
          <img src="https://ayf.pe/wp-content/uploads/2020/03/favicom-3.png" alt="A&F Servicios Empresariales" />
        </a>
        <nav aria-label="Navegación corporativa">
          <a href="#nosotros">Nosotros</a><a href="#vision">Visión</a><a href="#servicios">Servicios</a><a href="#contacto">Contacto</a>
        </nav>
        <Link className="corporate-login" to="/login">Acceso clientes</Link>
      </header>

      <main>
        <section className="corporate-hero" id="inicio">
          <div className="hero-overlay" />
          <div className="corporate-wrap hero-content">
            <p className="eyebrow">A&F Servicios Empresariales S.A.C.</p>
            <h1>Soluciones empresariales que se convierten en herramientas de gestión</h1>
            <p>Fortalecemos la relación con sus proveedores mediante información confiable para mejores decisiones.</p>
            <div className="hero-actions"><a className="corporate-primary" href="#servicios">Conoce nuestros servicios</a><a className="corporate-secondary" href="#contacto">Contáctanos</a></div>
          </div>
        </section>

        <section className="corporate-section corporate-wrap" id="nosotros">
          <div className="corporate-copy"><p className="eyebrow">Nosotros</p><h2>Experiencia que genera confianza</h2><p>Somos una organización de capitales peruanos que desarrolla sus actividades con un Grupo Humano con más de 15 años de experiencia en el sector, con gran capacidad para desarrollar soluciones empresariales, que se conviertan en Herramientas de Gestión para la toma de decisiones de nuestros Clientes con la finalidad de conseguir que la relación con sus proveedores sean más sólidas y seguras.</p><blockquote>“Lo que hacemos, no es un trabajo, es una Misión; si con ello generamos valor en la gestión de nuestros Clientes, esto se convierte en una meta a seguir.”</blockquote></div>
          <div className="corporate-image"><img src="https://ayf.pe/wp-content/uploads/2020/07/nosotros.webp" alt="Equipo profesional de A&F" /></div>
        </section>

        <section className="vision-section" id="vision"><div className="corporate-wrap vision-grid"><div><p className="eyebrow light">Nuestra visión</p><h2>Ser una empresa líder e innovadora</h2><p>Brindando servicios confiables, reconocida a nivel nacional, liderando el mercado a través de servicios personalizados, con calidad, rapidez de respuesta y alineados a las necesidades de nuestros Clientes; contribuyendo a la formalización y al desarrollo sostenible de las empresas en el país.</p></div><div className="experience-card"><strong>+15</strong><span>años de experiencia transformando información en decisiones</span></div></div></section>

        <section className="corporate-section services-section" id="servicios"><div className="corporate-wrap"><p className="eyebrow">Servicios</p><div className="section-title-row"><h2>Soluciones para una gestión empresarial más segura</h2><p>Servicios especializados, personalizados y orientados a resultados.</p></div><div className="services-grid">{services.map((service, index) => <article className="service-card" key={service.title}><img src={service.image} alt="" /><div><span>0{index + 1}</span><h3>{service.title}</h3><p>{service.text}</p></div></article>)}</div></div></section>

        <section className="contact-section" id="contacto"><div className="corporate-wrap contact-grid"><div><p className="eyebrow light">Contáctanos</p><h2>Completa tus datos para atenderte a la brevedad</h2><p>Conversemos sobre los retos de homologación y gestión de proveedores de tu empresa.</p><div className="contact-data"><p><strong>Teléfonos</strong><a href="tel:+51980431672">980 431 672</a><a href="tel:+51998127016">998 127 016</a><a href="tel:+51966986444">966 986 444</a></p><p><strong>Correos</strong><a href="mailto:rabraham@ayf.pe">rabraham@ayf.pe</a><a href="mailto:cferreyros@ayf.pe">cferreyros@ayf.pe</a></p></div></div><form className="contact-card" onSubmit={(event) => event.preventDefault()}><label>Nombre completo<input required placeholder="Tu nombre" /></label><label>Empresa<input required placeholder="Nombre de la empresa" /></label><label>Correo<input type="email" required placeholder="correo@empresa.com" /></label><label>Teléfono<input type="tel" placeholder="Número de contacto" /></label><label>Mensaje<textarea required rows={4} placeholder="¿Cómo podemos ayudarte?" /></label><a className="corporate-primary" href="mailto:rabraham@ayf.pe">Enviar consulta</a></form></div></section>
      </main>
      <footer className="corporate-footer"><div className="corporate-wrap"><img src="https://ayf.pe/wp-content/uploads/2020/03/favicom-3.png" alt="A&F" /><p>Copyright 2026 © A&F Servicios Empresariales S.A.C.</p><Link to="/login">Ingresar al sistema</Link></div></footer>
    </div>
  );
}

export default LandingPage;
