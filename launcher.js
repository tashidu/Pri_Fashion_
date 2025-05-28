#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Function to print colored text
function colorLog(text, color = 'white') {
    console.log(colors[color] + text + colors.reset);
}

// Function to show the logo
function showLogo() {
    console.clear();
    console.log('');
    colorLog('  ██████╗ ██████╗ ██╗    ███████╗ █████╗ ███████╗██╗  ██╗██╗ ██████╗ ███╗   ██╗', 'cyan');
    colorLog('  ██╔══██╗██╔══██╗██║    ██╔════╝██╔══██╗██╔════╝██║  ██║██║██╔═══██╗████╗  ██║', 'cyan');
    colorLog('  ██████╔╝██████╔╝██║    █████╗  ███████║███████╗███████║██║██║   ██║██╔██╗ ██║', 'cyan');
    colorLog('  ██╔═══╝ ██╔══██╗██║    ██╔══╝  ██╔══██║╚════██║██╔══██║██║██║   ██║██║╚██╗██║', 'cyan');
    colorLog('  ██║     ██║  ██║██║    ██║     ██║  ██║███████║██║  ██║██║╚██████╔╝██║ ╚████║', 'cyan');
    colorLog('  ╚═╝     ╚═╝  ╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝', 'cyan');
    console.log('');
    colorLog('                          Desktop Application Starting...', 'yellow');
    colorLog('===============================================================================', 'dim');
    console.log('');
}

// Function to check if a command exists
function commandExists(command) {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error) => {
            resolve(!error);
        });
    });
}

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Function to check if directory exists
function directoryExists(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (error) {
        return false;
    }
}

// Main launcher function
async function launchPriFashion() {
    try {
        // Show logo
        showLogo();

        // Get the directory where this script is located
        const scriptDir = path.dirname(process.argv[1]);
        process.chdir(scriptDir);

        // Step 1: Check Node.js installation
        colorLog('[1/4] Checking Node.js installation...', 'yellow');
        
        const nodeExists = await commandExists('node');
        if (!nodeExists) {
            colorLog('❌ Node.js is not installed or not in PATH.', 'red');
            colorLog('Please install Node.js and try again.', 'red');
            process.exit(1);
        }
        
        colorLog('✅ Node.js is installed.', 'green');
        console.log('');

        // Step 2: Check dependencies
        colorLog('[2/4] Checking dependencies...', 'yellow');
        
        if (!directoryExists('node_modules')) {
            colorLog('📦 Installing dependencies...', 'yellow');
            try {
                await runCommand('npm', ['install']);
                colorLog('✅ Dependencies installed successfully.', 'green');
            } catch (error) {
                colorLog('❌ Failed to install dependencies.', 'red');
                process.exit(1);
            }
        } else {
            colorLog('✅ Dependencies already installed.', 'green');
        }
        console.log('');

        // Step 3: Build React frontend
        colorLog('[3/4] Building React frontend...', 'yellow');
        
        const frontendDir = path.join(scriptDir, 'frontend');
        const buildDir = path.join(frontendDir, 'build');
        
        if (!directoryExists(buildDir)) {
            colorLog('🔨 Building React application...', 'yellow');
            try {
                await runCommand('npm', ['run', 'build'], { cwd: frontendDir });
                colorLog('✅ React frontend built successfully.', 'green');
            } catch (error) {
                colorLog('❌ Failed to build React frontend.', 'red');
                process.exit(1);
            }
        } else {
            colorLog('✅ React frontend already built.', 'green');
        }
        console.log('');

        // Step 4: Start the application
        colorLog('[4/4] Starting Pri Fashion Desktop Application...', 'yellow');
        colorLog('🚀 Launching application...', 'green');
        console.log('');
        colorLog('⏳ Please wait while the application loads...', 'yellow');
        colorLog('    - Django backend server starting...', 'dim');
        colorLog('    - React frontend server starting...', 'dim');
        colorLog('    - Desktop window will open shortly...', 'dim');
        console.log('');

        // Start the application
        try {
            await runCommand('npm', ['start']);
        } catch (error) {
            colorLog('❌ Failed to start the application.', 'red');
            console.error(error.message);
            process.exit(1);
        }

    } catch (error) {
        colorLog('❌ An unexpected error occurred:', 'red');
        console.error(error.message);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    colorLog('\n\nApplication interrupted by user.', 'yellow');
    process.exit(0);
});

process.on('SIGTERM', () => {
    colorLog('\n\nApplication terminated.', 'yellow');
    process.exit(0);
});

// Start the launcher
if (require.main === module) {
    launchPriFashion();
}

module.exports = { launchPriFashion };
