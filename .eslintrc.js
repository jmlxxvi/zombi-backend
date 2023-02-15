const { readdirSync, lstatSync } = require("fs");

const restricted_path_zones = [
    {
        "target": "source/platform/**/*",
        "from": "source/apps/**/*",
        "except": []
    },
    {
        "target": "source/platform/**/*",
        "from": "source/service/**/*",
        "except": []
    },
    {
        "target": "source/service/**/*",
        "from": "source/apps/**/*",
        "except": []
    },
    {
        "target": "source/platform/**/*",
        "from": "source/server/**/*",
        "except": ["**/types.ts"]
    },
    {
        "target": "source/apps/**/*",
        "from": "source/server/**/*",
        "except": ["**/types.ts"]
    },
    {
        "target": "source/service/**/*",
        "from": "source/server/**/*",
        "except": ["**/types.ts"]
    },
];

readdirSync("source/apps").forEach(file => {
    if (lstatSync(__dirname + "/source/apps/" + file).isDirectory()) {
        restricted_path_zones.push({
            "target": "source/apps/" + file + "/**/*",
            "from": "source/apps/!(" + file + ")/**/*"
        });
    }
});

module.exports = {
    "root": true,
    "parser": "@typescript-eslint/parser",
    "plugins": [
        "import",
        "deprecation",
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/typescript"
    ],
    "env": {
        "commonjs": true,
        "es2021": true,
        "node": true
    },
    "ignorePatterns": [
        "*.test.ts",
        "build/",
        ".*",
        "jest.*"
    ],
    "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module",
        "project": "./tsconfig.json",
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "no-unused-vars": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "comma-spacing": 2,
        "space-infix-ops": 2,
        "arrow-spacing": 2,
        "strict": ["error", "global"],
        "import/no-unresolved": 2,
        "import/export": 2,
        "import/default": 2,
        "import/no-deprecated": 2,
        "import/no-commonjs": 2,
        "import/no-amd": 2,
        "import/no-useless-path-segments": 2,
        "import/no-extraneous-dependencies": 2,
        "import/no-cycle": [2, { "maxDepth": 1 }],
        "import/no-self-import": 2,
        "import/no-mutable-exports": 2,
        "import/no-absolute-path": 2,
        "import/no-unused-modules": 2,
        "import/no-import-module-exports": 2,
        "import/no-restricted-paths": ["error", { "zones": restricted_path_zones }],
        "deprecation/deprecation": "error",
    },
    "settings": {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts"]
        },
        "import/resolver": {
            "typescript": {
                "alwaysTryTypes": true
            }
        }
    }
};
