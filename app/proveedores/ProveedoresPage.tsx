import { useMemo, useState } from 'react';
import { proveedoresMock } from '../../services/mockData';
import ProveedoresTable from '../../components/proveedores/ProveedoresTable';
import { Proveedor } from '../../types';

function ProveedoresPage() {
  const [search, setSearch] = useState('');
  const proveedoresFiltrados = useMemo(() => {
    if (!search.trim()) return proveedoresMock;
    return proveedoresMock.filter((proveedor: Proveedor) =>
      proveedor.razonSocial.toLowerCase().includes(search.toLowerCase()) || proveedor.ruc.includes(search),
    );
  }, [search]);

  return (
    <div className="container">
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="page-title">Información General de Proveedores</h2>
            <p className="secondary-text">Consulta el directorio completo de proveedores con datos de contacto y ubicación.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                ↻ Actualizar
              </button>
              <button className="btn-primary">
                Exportar Excel
              </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          <input
            type="text"
            placeholder="Buscar proveedor, RUC o distrito..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: '1 1 360px', padding: '0.9rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--color-border)' }}
          />
        </div>

        <ProveedoresTable proveedores={proveedoresFiltrados} />
      </section>
    </div>
  );
}

export default ProveedoresPage;
