function HomologacionesPage() {
  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Homologaciones</h2>
        <p className="secondary-text">Visualiza las solicitudes y el avance del proceso.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {['Registro', 'Documentación', 'Validación', 'Observaciones', 'Evaluación', 'Aprobación', 'Certificación'].map((step, index) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: index <= 3 ? 'var(--color-primary)' : 'var(--color-border)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700 }}>{index + 1}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{step}</p>
                  <p className="secondary-text" style={{ margin: 0 }}>Estado {index <= 3 ? 'Completo' : 'Pendiente'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomologacionesPage;
