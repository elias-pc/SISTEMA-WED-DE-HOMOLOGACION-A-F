import { useProveedores } from '../../src/providers/ProveedoresContext';

function HomologadasPage() {
  const { proveedores } = useProveedores();
  const homologadas = proveedores.filter((provider) => provider.flujo?.estado === 'HOMOLOGADO');
  return (
    <div className="container">
      <section className="card">
        <h2 className="page-title">Empresas Homologadas</h2>
        <p className="secondary-text">Consulta los proveedores homologados y el estado de sus certificados.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {homologadas.map((provider) => (
              <div key={provider.id} style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--color-border)', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{provider.razonSocial}</h3>
                  <span style={{ padding: '0.4rem 0.75rem', borderRadius: '999px', background: provider.flujo?.subestado === 'VENCIDO' ? '#fee2e2' : '#dcfce7', color: provider.flujo?.subestado === 'VENCIDO' ? '#b91c1c' : '#166534', fontWeight: 600 }}>{provider.flujo?.subestado?.split('_').join(' ')}</span>
                </div>
                <p className="secondary-text" style={{ margin: '0.75rem 0 0' }}>RUC {provider.ruc} · Vencimiento: {provider.vigencia}</p>
              </div>
            ))}
            {!homologadas.length ? <p className="secondary-text">No hay proveedores homologados en el proceso seleccionado.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomologadasPage;
