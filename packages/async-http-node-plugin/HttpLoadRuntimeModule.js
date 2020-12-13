/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

const RuntimeGlobals = require("webpack/lib/RuntimeGlobals");
const RuntimeModule = require("webpack/lib/RuntimeModule");
const Template = require("webpack/lib/Template");
const { chunkHasJs, getChunkFilenameTemplate } = require("webpack/lib/javascript/JavascriptModulesPlugin");
const compileBooleanMatcher = require("webpack/lib/util/compileBooleanMatcher");
const { getUndoPath } = require("webpack/lib/util/identifier");
const path = require("path");

class HttpLoadRuntimeModule extends RuntimeModule {
  constructor(runtimeRequirements) {
    super("http external", 11);
    this.runtimeRequirements = runtimeRequirements;
  }

  /**
   * @returns {string} runtime code
   */
  generate() {
    const { runtimeTemplate } = this.compilation;

    const code =
      `${RuntimeGlobals.require}.httpExternal = ` +
      runtimeTemplate.basicFunction(
        ["url"],
        [
          `return new Promise(${runtimeTemplate.basicFunction("resolve, reject", [
            `var filename = require("path").basename(url);`,
            `require("http").get(url, "utf-8", function (res) {`,
            Template.indent([
              `var statusCode = res.statusCode;`,
              `res.setEncoding("utf8");`,
              `let content = "";`,
              `if (statusCode !== 200) {`,
              Template.indent([`return reject(new Error("Request Failed. Status Code: " + statusCode));`]),
              `}`,
              `res.on("data", (c) => {`,
              Template.indent([`content += c;`]),
              `});`,
              `res.on("end", () => {`,
              Template.indent([
                `if (statusCode === 200) {`,
                Template.indent([
                  `let chunk = { exports: {} };`,
                  `require("vm").runInThisContext("(function(exports, require, module, __filename, __dirname){"+content+"}\\n)", filename)(`,
                  Template.indent([`chunk.exports,require,chunk,require("path").dirname(filename),filename`]),
                  `);`,
                  `resolve(chunk.exports);`,
                ]),
                `}`,
              ]),
              `});`,
            ]),
            `});`,
          ])})`,
        ]
      );

    return Template.asString([code]);
  }
}

module.exports = HttpLoadRuntimeModule;
