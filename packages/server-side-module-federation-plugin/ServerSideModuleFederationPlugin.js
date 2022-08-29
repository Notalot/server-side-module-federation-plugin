"use strict";

const webpack = require("webpack");
const RuntimeGlobals = require("webpack/lib/RuntimeGlobals");
const StartupChunkDependenciesPlugin = require("webpack/lib/runtime/StartupChunkDependenciesPlugin");
const HttpChunkLoadingRuntimeModule = require("./HttpChunkLoadingRuntimeModule");
const HttpLoadRuntimeModule = require("./HttpLoadRuntimeModule");
const NodeHttpExternalModule = require("./NodeHttpExternalModule");

const {compareModulesByIdentifier} = require("mini-css-extract-plugin/dist/utils");

const { parseOptions } = require("webpack/lib/container/options");
const { config } = require("webpack");

/** @typedef {import("webpack/lib/Compiler")} Compiler */

class ServerSideModuleFederationPlugin {
  constructor(options) {
    options = options || {};
    this._asyncChunkLoading = options.asyncChunkLoading;
    this._remotes = parseOptions(
      options.remotes,
      (item) => ({
        external: Array.isArray(item) ? item : [item],
        shareScope: options.shareScope || "default",
      }),
      (item) => ({
        external: Array.isArray(item.external) ? item.external : [item.external],
        shareScope: item.shareScope || options.shareScope || "default",
      })
    );
    this._options = options;
  }

  /**
   * Apply the plugin
   * @param {Compiler} compiler the compiler instance
   * @returns {void}
   */
  apply(compiler) {
    const { _remotes: remotes, _remoteType: remoteType, _options: { name }} = this;

    /** @type {Record<string, string>} */
    const remoteExternals = {};
    for (const [key, config] of remotes) {
      let i = 0;
      for (const external of config.external) {
        if (external.startsWith("internal ")) continue;
        remoteExternals[`webpack/container/reference/${key}${i ? `/fallback-${i}` : ""}`] = external;
        i++;
      }
    }

    new webpack.container.ModuleFederationPlugin(this._options).apply(compiler);

    compiler.hooks.compile.tap("NodeHttpChunkLoadingPlugin", ({ normalModuleFactory }) => {
      normalModuleFactory.hooks.factorize.tapAsync("NodeHttpChunkLoadingPlugin", (data, callback) => {
        const dependency = data.dependencies[0];
        if (Object.prototype.hasOwnProperty.call(remoteExternals, dependency.request)) {
          callback(null, new NodeHttpExternalModule(remoteExternals[dependency.request], "promise", dependency.request));
        } else {
          callback();
        }
      });
    });

    webpack.javascript.EnableChunkLoadingPlugin.setEnabled(compiler, "async-http-node");

    const chunkLoadingValue = "async-http-node";
    new StartupChunkDependenciesPlugin({
      chunkLoading: chunkLoadingValue,
      asyncChunkLoading: this._asyncChunkLoading,
    }).apply(compiler);

    compiler.hooks.thisCompilation.tap("NodeHttpChunkLoadingPlugin", (compilation) => {
      const globalChunkLoading = compilation.outputOptions.chunkLoading;
      const isEnabledForChunk = (chunk) => {
        const options = chunk.getEntryOptions();
        const chunkLoading = (options && options.chunkLoading) || globalChunkLoading;
        return chunkLoading === chunkLoadingValue;
      };
      const onceForChunkSet = new WeakSet();
      const handler = (chunk, set) => {
        if (onceForChunkSet.has(chunk)) return;
        onceForChunkSet.add(chunk);
        if (!isEnabledForChunk(chunk)) return;
        set.add(RuntimeGlobals.moduleFactoriesAddOnly);
        set.add(RuntimeGlobals.hasOwnProperty);
        set.add(RuntimeGlobals.publicPath);

        const m = new HttpChunkLoadingRuntimeModule(set);

        compilation.addRuntimeModule(chunk, m);
      };

      compilation.hooks.additionalTreeRuntimeRequirements.tap("NodeHttpChunkLoadingPlugin", (chunk, set) => {
        if (!isEnabledForChunk(chunk)) return;
        if (Array.from(chunk.getAllReferencedChunks()).some((c) => c !== chunk && compilation.chunkGraph.getNumberOfEntryModules(c) > 0)) {
          set.add(RuntimeGlobals.startupEntrypoint);
          set.add(RuntimeGlobals.externalInstallChunk);
        }
      });

      const miniExtractModule = "css/mini-extract";

      const { RuntimeGlobals, RuntimeModule, Template, runtime } = webpack;

      const getCssChunkObject = (mainChunk, compilation) => {
        /** @type {Record<string, number>} */
        const obj = {};
        const { chunkGraph } = compilation;

        for (const chunk of mainChunk.getAllAsyncChunks()) {
          const modules = chunkGraph.getOrderedChunkModulesIterable(
            chunk,
            compareModulesByIdentifier
          );

          for (const module of modules) {
            if (module.type === miniExtractModule) {
              obj[/** @type {string} */ (chunk.id)] = 1;

              break;
            }
          }
        }

        return obj;
      };

      class CssLoadingRuntimeModule extends RuntimeModule {
        /**
         * @param {Set<string>} runtimeRequirements
         * @param {RuntimeOptions} runtimeOptions
         */
        constructor(runtimeRequirements) {
          super("css loading", 10);

          this.runtimeRequirements = runtimeRequirements;
        }
        generate() {
          const { chunk, runtimeRequirements } = this;
          const {
            runtimeTemplate,
            outputOptions: { crossOriginLoading },
          } = this.compilation;
          
          const chunkMap = getCssChunkObject(chunk, this.compilation);

          const withLoading =
            runtimeRequirements.has(RuntimeGlobals.ensureChunkHandlers) &&
            Object.keys(chunkMap).length > 0;

          if (!withLoading) {
            return "";
          }

          return Template.asString([
            `var createStylesheet = ${runtimeTemplate.basicFunction(
              "chunkId, fullhref, resolve, reject",
              [
                `if (!global.css.includes(fullhref)) global.css.push(fullhref);`,
                Template.indent(["resolve();"]),
              ]
            )}`,
            `var loadStylesheet = ${runtimeTemplate.basicFunction(
              "chunkId",
              `return new Promise(${runtimeTemplate.basicFunction(
                "resolve, reject",
                [
                  `var href = ${RuntimeGlobals.require}.miniCssF(chunkId);`,
                  `var fullhref = ${RuntimeGlobals.publicPath} + href;`,
                  "createStylesheet(chunkId, fullhref, resolve, reject);",
                ]
              )});`,
            )}`,
            withLoading
              ? Template.asString([
                  "// object to store loaded CSS chunks",
                  "var installedCssChunks = {",
                  Template.indent(
                    /** @type {string[]} */
                    (chunk.ids)
                      .map((id) => `${JSON.stringify(id)}: 0`)
                      .join(",\n")
                  ),
                  "};",
                  "",
                  `${
                    RuntimeGlobals.ensureChunkHandlers
                  }.miniCss = ${runtimeTemplate.basicFunction(
                    "chunkId, promises",
                    [
                      `var cssChunks = ${JSON.stringify(chunkMap)};`,
                      `global.css = [...(global.css || [])];`,
                      `loadStylesheet(chunkId);`,
                    ]
                  )};`,
                ])
              : "// no chunk loading",
            "",
          ]);
        }
      };

      const enabledChunks = new WeakSet();

      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunkHandlers)
        .tap("mini-css-extract-plugin", (chunk, set) => {
          if (enabledChunks.has(chunk)) {
            return;
          }
  
          enabledChunks.add(chunk);
  
          set.add(RuntimeGlobals.publicPath);
  
          compilation.addRuntimeModule(
            chunk,
            new runtime.GetChunkFilenameRuntimeModule(
              miniExtractModule,
              "mini-css",
              `${RuntimeGlobals.require}.miniCssF`,
              /**
               * @param {Chunk} referencedChunk
               * @returns {TODO}
               */
              (referencedChunk) => {
                if (!referencedChunk.contentHash[miniExtractModule]) {
                  return false;
                }
  
                // TODO
                return '[contenthash].css';
              },
              false
            )
          );
  
          compilation.addRuntimeModule(
            chunk,
            new CssLoadingRuntimeModule(set)
          );
        });
      
      compilation.hooks.additionalTreeRuntimeRequirements.tap("NodeHttpChunkLoadingPlugin", (chunk, set) => {
        const m = new HttpLoadRuntimeModule(set);
        compilation.addRuntimeModule(chunk, m);
      });

      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.loadScript).tap("NodeHttpChunkLoadingPlugin", (chunk, set) => {
        const m = new HttpLoadScriptRuntimeModule(set);
        compilation.addRuntimeModule(chunk, m);
      });
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.ensureChunkHandlers).tap("NodeHttpChunkLoadingPlugin", handler);
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.baseURI).tap("NodeHttpChunkLoadingPlugin", handler);
      compilation.hooks.runtimeRequirementInTree.for(RuntimeGlobals.ensureChunkHandlers).tap("NodeHttpChunkLoadingPlugin", (chunk, set) => {
        if (!isEnabledForChunk(chunk)) return;
        set.add(RuntimeGlobals.getChunkScriptFilename);
      });
    });
  }
}

module.exports = ServerSideModuleFederationPlugin;
