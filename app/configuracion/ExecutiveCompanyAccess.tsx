import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AuthUser, Empresa } from '../../types';

type ExecutiveFeedback = { kind: 'success' | 'error'; text: string };

export default function ExecutiveCompanyAccess({ companies }: { companies: Empresa[] }) {
  const [executives, setExecutives] = useState<AuthUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [feedback, setFeedback] = useState<Record<string, ExecutiveFeedback | undefined>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.executives().then(({ users }) => {
      if (!active) return;
      setExecutives(users);
      setDrafts(Object.fromEntries(users.map((item) => [item.id, item.empresaIds])));
    }).catch((error: unknown) => {
      if (active) setFeedback({ _list: { kind: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar la lista de ejecutivas.' } });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [companies]);

  const toggleCompany = (executive: AuthUser, companyId: string) => {
    setDrafts((current) => {
      const selected = current[executive.id] || [];
      return { ...current, [executive.id]: selected.includes(companyId) ? selected.filter((id) => id !== companyId) : [...selected, companyId] };
    });
    setFeedback((current) => ({ ...current, [executive.id]: undefined }));
  };

  const save = async (executive: AuthUser) => {
    const empresaIds = drafts[executive.id] || [];
    if (!empresaIds.length) {
      setFeedback((current) => ({ ...current, [executive.id]: { kind: 'error', text: 'Vincula al menos una empresa a la ejecutiva.' } }));
      return;
    }
    setSavingId(executive.id);
    setFeedback((current) => ({ ...current, [executive.id]: undefined }));
    try {
      const { user } = await api.updateExecutiveCompanies(executive.id, empresaIds);
      setExecutives((current) => current.map((item) => item.id === user.id ? user : item));
      setDrafts((current) => ({ ...current, [user.id]: user.empresaIds }));
      setFeedback((current) => ({ ...current, [user.id]: { kind: 'success', text: 'Empresas vinculadas correctamente.' } }));
    } catch (error) {
      setFeedback((current) => ({ ...current, [executive.id]: { kind: 'error', text: error instanceof Error ? error.message : 'No se pudieron guardar los cambios.' } }));
    } finally { setSavingId(''); }
  };

  return <section className="card executive-company-access">
    <h3>Acceso de ejecutivas por empresa</h3>
    <p className="secondary-text">Vincula cada ejecutiva con las empresas en las que puede recibir proveedores. El acceso a cada cartera seguirá limitado a sus asignaciones.</p>
    {feedback._list ? <p className="form-error" role="alert">{feedback._list.text}</p> : null}
    {loading ? <p className="secondary-text">Cargando ejecutivas…</p> : executives.length ? <div className="executive-company-list">
      {executives.map((executive) => {
        const selected = drafts[executive.id] || [];
        const unchanged = selected.length === executive.empresaIds.length && selected.every((id) => executive.empresaIds.includes(id));
        const message = feedback[executive.id];
        return <article className="executive-company-row" key={executive.id}>
          <div className="executive-company-identity"><strong>{executive.name}</strong><span>{executive.email}</span></div>
          <fieldset className="executive-company-options">
            <legend>Empresas habilitadas</legend>
            {companies.map((company) => <label key={company.id}>
              <input type="checkbox" checked={selected.includes(company.id)} onChange={() => toggleCompany(executive, company.id)} />
              <span>{company.nombreComercial}</span>
            </label>)}
          </fieldset>
          <div className="executive-company-save">
            <button type="button" className="btn-primary" disabled={savingId === executive.id || unchanged} onClick={() => void save(executive)}>{savingId === executive.id ? 'Guardando…' : 'Guardar empresas'}</button>
            {message ? <span className={message.kind === 'success' ? 'success-message' : 'form-error'} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</span> : null}
          </div>
        </article>;
      })}
    </div> : !feedback._list ? <p className="secondary-text">No hay ejecutivas activas para configurar.</p> : null}
  </section>;
}
