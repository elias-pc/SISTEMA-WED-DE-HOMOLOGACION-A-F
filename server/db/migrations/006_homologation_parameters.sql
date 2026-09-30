-- Parámetros de homologación definidos por cada empresa cliente.
-- Se conserva una configuración por defecto para las empresas existentes.
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS homologation_config jsonb NOT NULL DEFAULT '{
    "filters": [],
    "documentTypes": [
      {"name": "Certificado", "validityDays": 360},
      {"name": "Constancia", "validityDays": 360}
    ],
    "opinions": ["Apto", "No Apto", "Otros"],
    "evaluationModules": [
      "Formalidad y legales",
      "Capacidad operativa",
      "Producción y servicios",
      "SSO",
      "Ambiental",
      "Calidad",
      "Inocuidad - HACCP",
      "Responsabilidad social",
      "Sostenibilidad",
      "BASC",
      "POES",
      "Comerciales",
      "Protección de datos",
      "Económica-financiera",
      "Otros"
    ]
  }'::jsonb;
