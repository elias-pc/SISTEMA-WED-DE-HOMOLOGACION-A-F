function ReportesPage() {
  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Reportes</h2>
        <p className="secondary-text">Indicadores clave para la toma de decisiones y seguimiento de homologaciones.</p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {['Homologaciones mensuales', 'Proveedores por estado', 'Indicadores por cliente', 'Certificados próximos a vencer'].map((item) => (
            <div key={item} className="card" style={{ padding: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{item}</h3>
              <p className="secondary-text" style={{ marginTop: '0.75rem' }}>Vista de datos ejecutivos para análisis rápido.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReportesPage;
