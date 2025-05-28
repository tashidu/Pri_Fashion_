#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorLog(text, color = 'white') {
    console.log(colors[color] + text + colors.reset);
}

function checkCommand(command) {
    return new Promise((resolve) => {
        exec(`${command} --version`, (error) => {
            resolve(!error);
        });
    });
}

function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true
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

async function createExecutable() {
    colorLog('Pri Fashion Node.js Executable Creator', 'cyan');
    colorLog('=====================================', 'cyan');
    console.log('');

    try {
        // Check if pkg is installed
        colorLog('Checking for pkg...', 'yellow');
        const pkgExists = await checkCommand('pkg');
        
        if (!pkgExists) {
            colorLog('pkg not found. Installing pkg globally...', 'yellow');
            try {
                await runCommand('npm', ['install', '-g', 'pkg']);
                colorLog('✅ pkg installed successfully', 'green');
            } catch (error) {
                colorLog('❌ Failed to install pkg. Please install manually:', 'red');
                colorLog('npm install -g pkg', 'white');
                return;
            }
        } else {
            colorLog('✅ pkg found', 'green');
        }

        // Check if launcher.js exists
        const launcherPath = path.join(__dirname, 'launcher.js');
        if (!fs.existsSync(launcherPath)) {
            colorLog('❌ launcher.js not found!', 'red');
            return;
        }

        colorLog('✅ launcher.js found', 'green');
        console.log('');

        // Create the executable
        colorLog('Creating executable with pkg...', 'yellow');
        colorLog('This may take a few minutes...', 'yellow');
        
        try {
            await runCommand('pkg', [
                'launcher.js',
                '--target', 'node18-win-x64',
                '--output', 'PriFashion.exe'
            ]);
            
            // Check if executable was created
            const exePath = path.join(__dirname, 'PriFashion.exe');
            if (fs.existsSync(exePath)) {
                colorLog('✅ Executable created successfully!', 'green');
                colorLog(`Location: ${exePath}`, 'green');
                console.log('');
                colorLog('You can now:', 'cyan');
                colorLog('1. Double-click PriFashion.exe to run your application', 'white');
                colorLog('2. Copy PriFashion.exe to your desktop', 'white');
                colorLog('3. Create a shortcut to PriFashion.exe', 'white');
            } else {
                colorLog('❌ Executable was not created', 'red');
            }
        } catch (error) {
            colorLog('❌ Failed to create executable with pkg', 'red');
            colorLog('Error: ' + error.message, 'red');
        }

    } catch (error) {
        colorLog('❌ An error occurred: ' + error.message, 'red');
    }
}

// Run the script
if (require.main === module) {
    createExecutable();
}
