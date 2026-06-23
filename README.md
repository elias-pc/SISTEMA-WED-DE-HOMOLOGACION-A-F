# af-homologacion

Scaffold React + Vite para el Sistema de Homologación A&F.

## Cómo ejecutar

1. Instala dependencias:

```bash
cd e:/USUARIO/escritorio/SYSTEM/af-homologacion
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

3. Abre `http://localhost:4173`

## Estructura de carpetas

- `src/`: código fuente de la aplicación React.
- `app/`: páginas de la aplicación.
- `components/`: componentes compartidos y de layout.
- `styles/`: estilos globales.
- `public/`: assets públicos.

## Páginas incluidas

- `Login`
- `Dashboard`
- `Proveedores`
- `Homologaciones`
- `Empresas Homologadas`
- `Reportes`
- `Configuración`
- `Perfil`

## Siguientes pasos

- Añadir datos mock y servicios.
- Crear componentes reutilizables para tablas, cards y gráficos.
- Añadir autenticación real y rutas protegidas.

## Despliegue en Vercel

1. Crea un nuevo proyecto en Vercel y conecta el repositorio.
2. Configura el framework como `Vite`.
3. Usa el comando de build: `npm run build`.
4. Usa el directorio de salida: `dist`.
5. El archivo `vercel.json` ya incluye la regla SPA para que todas las rutas se redirijan a `index.html`.
