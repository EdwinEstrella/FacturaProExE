export default [
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                // Node.js globals
                process: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                global: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',

                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                location: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',

                // Electron globals
                ipcRenderer: 'readonly',
                ipcMain: 'readonly',
                app: 'readonly',
                BrowserWindow: 'readonly',
                dialog: 'readonly',

                // Third-party libraries
                bootstrap: 'readonly',
                bcrypt: 'readonly',
                crypto: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', {
                'vars': 'all',
                'args': 'after-used',
                'ignoreRestSiblings': true,
                'varsIgnorePattern': '^_',
                'argsIgnorePattern': '^_'
            }],
            'no-console': 'off',
            'no-undef': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'indent': ['error', 4],
            'no-multiple-empty-lines': ['error', { 'max': 1 }],
            'eol-last': ['error', 'always']
        }
    }
];
