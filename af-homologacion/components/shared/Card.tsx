import { PropsWithChildren } from 'react';

function Card({ children }: PropsWithChildren) {
  return (
    <div className="card" style={{ background: 'var(--color-surface)', borderRadius: '1rem' }}>
      {children}
    </div>
  );
}

export default Card;
