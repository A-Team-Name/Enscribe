/** @type {import('jest').Config} */
const config = {
    verbose: true,
    testMatch: [ "**/__tests__/**/*.?(m)[jt]s?(x)", "**/?(*.)+(spec|test).?(m)[jt]s?(x)" ],
    testEnvironment: "jsdom",
};

export default config;
