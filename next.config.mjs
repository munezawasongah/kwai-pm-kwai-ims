/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "@prisma/client", "bcryptjs"],
  },
  async rewrites() {
    // The public marketing site lives as static HTML in /public/site.
    // beforeFiles runs ahead of filesystem + app-router resolution, giving clean
    // URLs (/about) without an .html extension, while /dashboard etc. stay on
    // the Next.js app router.
    return {
      beforeFiles: [
        { source: "/", destination: "/site/index.html" },
        { source: "/about", destination: "/site/about.html" },
        { source: "/destinations", destination: "/site/destinations.html" },
        { source: "/experiences", destination: "/site/experiences.html" },
        { source: "/voices", destination: "/site/voices.html" },
        { source: "/contact", destination: "/site/contact.html" },
        { source: "/privacy", destination: "/site/privacy.html" },
        { source: "/terms", destination: "/site/terms.html" },
        { source: "/safety", destination: "/site/safety.html" },
      ],
    };
  },
};

export default nextConfig;
