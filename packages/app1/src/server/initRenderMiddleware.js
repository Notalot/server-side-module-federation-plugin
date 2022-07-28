export default async function initRenderMiddleware(app) {
  app.get("/test", async (req, res, next) => {
    // always refresh the renderer implementation
    const { html } = (await import("./renderer")).default();
    delete require.cache[require.resolve("./renderer")];
    res.send(`
    <!DOCTYPE html>
<html>
<body>
  <script src="/dist/client/main.js" type="text/javascript"></script>
  <div id="root">${html}</div>
</body>
</html>
    `);
  });
}
