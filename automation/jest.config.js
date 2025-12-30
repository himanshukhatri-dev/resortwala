module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['**/api-tests-jest/specs/**/*.spec.js'],
    setupFiles: ['dotenv/config'],
};
