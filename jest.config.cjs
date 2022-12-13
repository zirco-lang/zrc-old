module.exports = {
    testEnvironment: 'node',
    roots: ['./src'],
    testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
    transform: {
        '^.+\\.(js|ts)$': 'babel-jest',
    },
    moduleDirectories: ['node_modules', 'src'],
    collectCoverage: true,
    collectCoverageFrom: ['**/*.{js,ts}', '!**/*.d.ts'],
}
