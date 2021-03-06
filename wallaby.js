module.exports = function (w) {
    process.env.TSC_WATCHFILE = "UseFsEventsWithFallbackDynamicPolling"
    return {
      files: [
        "**/**/*.ts",
        "**/**/*.json",
        "!./e2e/",
        "!./dist/",
        "!**/bin/**/*.ts",
        "!**/*.d.ts",
        "!**/*.test.ts",
        "!**/node_modules",
        "!node_modules/",
        "!.git/",
      ],

      tests: [
        "./**/*.test.ts",
        "!./e2e/",
        "!./dist/",
        "!**/node_modules",
        "!node_modules/",
        "!.git/",
      ],
      filesWithNoCoverageCalculated: ["**/*.spec.ts"],
      // for node.js tests you need to set env property as well
      // https://wallabyjs.com/docs/integration/node.html
      env: {
        type: "node",
        runner: "node",
      },

      testFramework: "jest",
      compilers: {
        "**/*.ts?(x)": w.compilers.typeScript({ isolatedModules: true }),
      },
    }
  }
