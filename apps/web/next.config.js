const API_PORT = process.env.API_PORT ?? 4001;
// En conteneur, l'API n'est pas sur "localhost" mais sur le nom du service Docker (ex. "api").
const API_HOST = process.env.API_INTERNAL_HOST ?? 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build autonome (server.js + node_modules minimaux) pour une image Docker de prod légère.
  output: 'standalone',
  // Proxie /api/* vers l'API NestJS locale. Ça rend le navigateur toujours "same-origin"
  // (une seule origine/port exposée côté client), ce qui est nécessaire dès qu'on accède à
  // l'app via un tunnel (ngrok, etc.) qui n'expose qu'un seul port à la fois — et ça règle
  // du même coup, de façon structurelle, le souci de cookie SameSite cross-site décrit dans
  // apps/web/src/lib/api.ts.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://${API_HOST}:${API_PORT}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
