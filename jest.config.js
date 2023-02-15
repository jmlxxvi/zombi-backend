module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testPathIgnorePatterns: ["node_modules", ".d.ts", ".js"],
    verbose: true,
    testTimeout: 20000,
    // TODO we are experimenting with @swc/jest to make the tests compile faster.
    // please take into account that with @swc/jest the source files are not type checked, 
    // just the TS extensions removed. 
    // To type check the source code tsc shuuld run somewhere on the pipeline.
    // transform: {
    //     '^.+\\.ts?$': [
    //       'ts-jest',
    //       { isolatedModules: false, },
    //     ],
    // },
    transform: {
        "^.+\\.ts?$": ["@swc/jest"],
    },
    collectCoverage: true,
    coverageReporters: ["text", "text-summary"],
    coveragePathIgnorePatterns: [
        "node_modules",
        "build",
        "source/test",
        "source/platform/system/log",
        "source/platform/cloud/aws/index.ts",
    ],
    globalSetup: "./jest.global_setup.ts",
    globalTeardown: "./jest.global_teardown.ts",
    // stop after first failing test
    bail: true,
};