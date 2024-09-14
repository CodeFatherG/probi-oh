module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/core', '<rootDir>/test'],
    testMatch: ['**/src/core/**/*.test.ts', '**/test/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    // Coverage configuration
    collectCoverage: true,
    coverageReporters: ['text', 'lcov', 'html'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    // Ignore coverage for certain files or directories
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/test/',
        '/src/(?!core)/'  // Ignore everything in src except the core folder
    ]
};