/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração de rewrites para atuar como proxy em desenvolvimento
  async rewrites() {
    return [
      {
        source: '/api/:path*', // Captura todas as rotas que começam com /api
        destination: 'http://localhost:4001/api/:path*', // E as redireciona para o nosso API Gateway
      },
    ];
  },
};

export default nextConfig;