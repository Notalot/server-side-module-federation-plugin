const getTemplate = (html, css) => (`
  <!DOCTYPE html>
  <html>
    <head>
      ${
        css.map((name) => (
          `<link rel="stylesheet" type="text/css" href="${name.replace('server', 'client')}" />`
        )).join('\n')
      }
    </head>
    <body>
      <div id="root">${html}</div>
      <script src="/client/main.js" type="text/javascript"></script>
    </body>
  </html>
`);

export default async function initRenderMiddleware(app) {
  app.get("/test", async (req, res, next) => {
    // always refresh the renderer implementation
    const { html, css } = await (await import("./renderer")).default();
    delete require.cache[require.resolve("./renderer")];

    const page = getTemplate(html, css);

    res.send(page);
  });
  app.get("/test2", async (req, res, next) => {
    // always refresh the renderer implementation
    const { html, css } = await (await import("./renderer")).default(true);
    delete require.cache[require.resolve("./renderer")];

    const page = getTemplate(html, css);

    res.send(page);
  });
}
