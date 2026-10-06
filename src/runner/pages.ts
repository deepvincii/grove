function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Small standalone page the proxy shows when an app can't be reached. */
export function statusPage(options: {
  status: number;
  title: string;
  message: string;
  link?: { href: string; label: string };
}): string {
  const { status, title, message, link } = options;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Grove</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f7f7f2;
    color: #13241b; font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { max-width: 460px; padding: 40px 28px; }
  .code { font: 13px ui-monospace, Menlo, monospace; color: #8d928e; }
  h1 { font: 400 32px/1.2 ui-serif, Georgia, serif; margin: 8px 0 8px; }
  p { color: #5b625d; margin: 0 0 24px; }
  a { display: inline-block; background: #1e4d36; color: #fff; text-decoration: none;
    border-radius: 6px; padding: 8px 16px; font-weight: 500; }
  a:hover { background: #143726; }
</style>
</head>
<body>
<main>
  <span class="code">Error ${status}</span>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  ${link ? `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>` : ""}
</main>
</body>
</html>`;
}
