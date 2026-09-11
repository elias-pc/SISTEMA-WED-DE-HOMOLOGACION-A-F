import { describe, expect, it } from 'vitest';
import { config, validateNotificationConfiguration } from './config.js';

describe('configuración local y de notificaciones', () => {
  it('mantiene WhatsApp desactivado sin credenciales de Meta', () => {
    expect(config.whatsappEnabled).toBe(false);
    expect(validateNotificationConfiguration()).toEqual({ enabled: false, missing: [] });
  });

  it('usa almacenamiento documental local durante el desarrollo', () => {
    expect(config.documentStorageDriver).toBe('local');
    expect(config.documentStoragePath).toBe('./data/uploads');
  });
});
