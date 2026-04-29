#!/usr/bin/env node

/**
 * Pre-Deployment Configuration Checker
 * Validates that the project is ready for production deployment
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REQUIRED_ENV_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
];

const REQUIRED_FILES = [
    'package.json',
    'vite.config.ts',
    'vercel.json',
    '.gitignore',
    'index.html',
    'src/main.tsx'
];

const REQUIRED_SQL_SCHEMAS = [
    'supabase-schema-points.sql',
    'supabase-schema-otp.sql',
    'supabase-schema-points-update.sql'
];

let hasErrors = false;
let hasWarnings = false;

console.log('\n🔍 GxDrip Deployment Readiness Check\n');
console.log('='.repeat(50));

// Check 1: Required Files
console.log('\n📁 Checking required files...');
REQUIRED_FILES.forEach(file => {
    if (existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        hasErrors = true;
    }
});

// Check 2: SQL Schema Files
console.log('\n📊 Checking database schema files...');
REQUIRED_SQL_SCHEMAS.forEach(file => {
    if (existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ⚠️  ${file} - MISSING (required for Supabase setup)`);
        hasWarnings = true;
    }
});

// Check 3: Environment Variables Template
console.log('\n🔐 Checking environment configuration...');
if (existsSync('.env.example')) {
    console.log('  ✅ .env.example exists');

    const envExample = readFileSync('.env.example', 'utf-8');
    REQUIRED_ENV_VARS.forEach(varName => {
        if (envExample.includes(varName)) {
            console.log(`  ✅ ${varName} documented`);
        } else {
            console.log(`  ❌ ${varName} missing from .env.example`);
            hasErrors = true;
        }
    });
} else {
    console.log('  ❌ .env.example - MISSING');
    hasErrors = true;
}

// Check 4: .gitignore
console.log('\n🚫 Checking .gitignore...');
if (existsSync('.gitignore')) {
    const gitignore = readFileSync('.gitignore', 'utf-8');
    const criticalIgnores = ['.env', 'node_modules', 'dist'];

    criticalIgnores.forEach(item => {
        if (gitignore.includes(item)) {
            console.log(`  ✅ ${item} is ignored`);
        } else {
            console.log(`  ❌ ${item} NOT in .gitignore - SECURITY RISK!`);
            hasErrors = true;
        }
    });
} else {
    console.log('  ❌ .gitignore - MISSING');
    hasErrors = true;
}

// Check 5: Package.json
console.log('\n📦 Checking package.json...');
if (existsSync('package.json')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

    if (pkg.scripts?.build) {
        console.log('  ✅ Build script exists');
    } else {
        console.log('  ❌ Build script missing');
        hasErrors = true;
    }

    if (pkg.scripts?.dev) {
        console.log('  ✅ Dev script exists');
    } else {
        console.log('  ⚠️  Dev script missing');
        hasWarnings = true;
    }

    if (pkg.dependencies) {
        const criticalDeps = ['react', 'react-dom', 'fabric', '@supabase/supabase-js'];
        criticalDeps.forEach(dep => {
            if (pkg.dependencies[dep]) {
                console.log(`  ✅ ${dep} installed`);
            } else {
                console.log(`  ❌ ${dep} missing from dependencies`);
                hasErrors = true;
            }
        });
    }
}

// Check 6: Vercel Configuration
console.log('\n🌐 Checking Vercel configuration...');
if (existsSync('vercel.json')) {
    const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'));

    if (vercelConfig.buildCommand) {
        console.log(`  ✅ Build command: ${vercelConfig.buildCommand}`);
    } else {
        console.log('  ⚠️  Build command not specified');
        hasWarnings = true;
    }

    if (vercelConfig.outputDirectory) {
        console.log(`  ✅ Output directory: ${vercelConfig.outputDirectory}`);
    } else {
        console.log('  ⚠️  Output directory not specified');
        hasWarnings = true;
    }

    if (vercelConfig.rewrites) {
        console.log('  ✅ SPA rewrites configured');
    } else {
        console.log('  ⚠️  No rewrites configured (may cause routing issues)');
        hasWarnings = true;
    }
}

// Check 7: Documentation
console.log('\n📚 Checking documentation...');
const docs = ['README.md', 'DEPLOYMENT.md'];
docs.forEach(doc => {
    if (existsSync(doc)) {
        console.log(`  ✅ ${doc}`);
    } else {
        console.log(`  ⚠️  ${doc} - MISSING`);
        hasWarnings = true;
    }
});

// Final Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary:\n');

if (!hasErrors && !hasWarnings) {
    console.log('✅ All checks passed! Your project is ready for deployment.\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run build');
    console.log('  2. Test the build: npm run preview');
    console.log('  3. Push to GitHub');
    console.log('  4. Deploy to Vercel');
    console.log('  5. Configure environment variables in Vercel');
    console.log('  6. Update Supabase redirect URLs\n');
    process.exit(0);
} else if (hasErrors) {
    console.log('❌ ERRORS FOUND - Please fix the issues above before deploying.\n');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  WARNINGS FOUND - Review the warnings above.\n');
    console.log('You can proceed with deployment, but address warnings for best results.\n');
    process.exit(0);
}
