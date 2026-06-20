function HomologadasPage() {
  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Empresas Homologadas</h2>
        <p className="secondary-text">Consulta los proveedores homologados y el estado de sus certificados.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--color-border)', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Proveedor {index + 1} SAC</h3>
                  <span style={{ padding: '0.4rem 0.75rem', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>Activo</span>
                </div>
                <p className="secondary-text" style={{ margin: '0.75rem 0 0' }}>Fecha emisión: 12 mar 2025 · Vencimiento: 12 mar 2026</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomologadasPage;
