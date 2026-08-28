# Regras do Projeto Alerta Criminal

- **PWA & Ícones (NÃO REVERTER)**: O PWA (Progressive Web App) utiliza o escudo do projeto (`public/escudo-logo.png` base) como ícone. Foram gerados arquivos `.png` válidos a partir dele (`pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon-new.png`, `favicon-32x32.png`, `og-image-shield.png`). Não reverta essas alterações no `vite.config.ts` nem no `index.html`. Estes arquivos são cruciais para que o app seja instalável e mostre o logo na pré-visualização (WhatsApp/OpenGraph).
- **Tema**: Padrão Dark (Slate-900).
- **Domain Oficial**: O aplicativo aponta para `https://alertacriminal.com.br/` (Tags de compartilhamento/SEO no `index.html` devem usar esse domínio).
