import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

/** Google gsi/client: her yanıtta COOP (rolldown-vite’da server.headers tek başına yetmeyebilir). */
function coopUnsafeNoneDevPlugin(): Plugin {
  return {
    name: "tiempos-coop-unsafe-none",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
        next();
      });
    },
  };
}

/** Yanlış süreç 8080’deyken /api/skills vb. 500 döner; dev başında bir kez uyar */
function apiProxySanityCheckPlugin(proxyBase: string): Plugin {
  return {
    name: "tiempos-api-proxy-check",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const base = proxyBase.replace(/\/+$/, "");
        const healthUrl = new URL("/actuator/health", `${base}/`);
        const req = http.get(healthUrl, (res) => {
          let body = "";
          res.on("data", (c) => {
            body += c;
          });
          res.on("end", () => {
            const looksLikeSpringHealth =
              res.statusCode === 200 &&
              body.includes('"status"') &&
              (body.includes("UP") || body.includes("DOWN"));
            if (!looksLikeSpringHealth) {
              console.warn(
                `\n\x1b[33m[tiempos]\x1b[0m ${healthUrl.href} beklenen Spring Boot actuator yanıtı değil (HTTP ${res.statusCode}). ` +
                  `DEV_API_PROXY=${base} bu projenin API’si olmayabilir; GET /api/skills ve POST /api/auth/social-login hata verebilir. ` +
                  `Çözüm: doğru API portunu kullanın veya diğer projeyi 8080’den kaldırın.\n`,
              );
            }
          });
        });
        req.setTimeout(3500, () => {
          req.destroy();
          console.warn(
            `\n\x1b[33m[tiempos]\x1b[0m ${healthUrl.href} zaman aşımı — API çalışıyor mu?\n`,
          );
        });
        req.on("error", (err: NodeJS.ErrnoException) => {
          console.warn(
            `\n\x1b[33m[tiempos]\x1b[0m API’ye ulaşılamadı (${healthUrl.href}): ${err.message}. ` +
              "`docker compose up -d api` veya kök `.env` içinde `DEV_API_PROXY` ayarlayın.\n",
          );
        });
      });
    },
  };
}

function googleAnalyticsHtmlPlugin(gaId: string | undefined): Plugin {
  return {
    name: "inject-google-analytics",
    transformIndexHtml(html) {
      const id = gaId?.trim();
      if (!id?.startsWith("G-")) return html;
      const snippet = `<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    </script>`;
      return html.replace("<head>", `<head>\n${snippet}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const gaId = env.VITE_GA_MEASUREMENT_ID;
  /** Yerelde 8080 başka bir konteyner/süreç tarafından doluysa: .env → DEV_API_PROXY=http://localhost:8082 */
  const devApiProxy = (env.DEV_API_PROXY || "http://localhost:8080").trim().replace(/\/+$/, "");
  /**
   * Google gsi/client (popup / postMessage): `same-origin-allow-popups` bazı tarayıcı ve
   * rolldown-vite ile yine client:380’de bloklanabiliyor. Bu başlıklar yalnızca yerel
   * `vite` / `vite preview` sunucusuna gider; prod’da nginx (allow-popups) geçerli.
   */
  const coopForGoogleSignIn = {
    "Cross-Origin-Opener-Policy": "unsafe-none",
  } as const;

  return {
    envDir: projectRoot,
    envPrefix: ["VITE_", "GOOGLE_"],
    plugins: [
      coopUnsafeNoneDevPlugin(),
      react(),
      tailwindcss(),
      googleAnalyticsHtmlPlugin(gaId),
      apiProxySanityCheckPlugin(devApiProxy),
    ],
    server: {
      headers: { ...coopForGoogleSignIn },
      proxy: {
        "/api": {
          target: devApiProxy,
          changeOrigin: true,
          configure(proxy) {
            /** Bağlantı reddedildi / hedef kapalı → tarayıcıda “500” gibi görünmesin; 502 + JSON mesajı. */
            proxy.on("error", (err, req, res) => {
              const out = res as http.ServerResponse;
              if (out.headersSent) return;
              const path = req && "url" in req && typeof req.url === "string" ? req.url : "/api";
              out.writeHead(502, {
                "Content-Type": "application/json; charset=utf-8",
              });
              out.end(
                JSON.stringify({
                  timestamp: new Date().toISOString(),
                  status: 502,
                  message:
                    `Vite proxy: backend’e ulaşılamadı (${devApiProxy}). ` +
                    "`docker compose up -d api db` çalıştırın veya kök `.env` içinde `DEV_API_PROXY` değerini API’nin dinlediği adrese ayarlayın " +
                    `(örn. http://localhost:8080). Teknik: ${err instanceof Error ? err.message : String(err)}`,
                  path,
                }),
              );
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              const auth = req.headers.authorization;
              if (auth) {
                proxyReq.setHeader("Authorization", auth);
              }
            });
          },
        },
      },
    },
    preview: {
      headers: { ...coopForGoogleSignIn },
    },
  };
});
