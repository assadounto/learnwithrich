import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
 images: { unoptimized: true }, poweredByHeader: false,
 async headers(){return [{source:'/:path*',headers:[
  {key:'Cross-Origin-Opener-Policy',value:'same-origin-allow-popups'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'X-Content-Type-Options',value:'nosniff'}
 ]}]}
};
export default nextConfig;
