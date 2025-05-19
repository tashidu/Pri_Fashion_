/**
 * Script to update the API configuration for production deployment
 *
 * This script is run during the build process to update the API base URL
 * with the actual PythonAnywhere domain.
 */

const fs = require('fs');
const path = require('path');

// Get the PythonAnywhere username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Error: PythonAnywhere username is required');
  console.error('Usage: node update-api-config.js <username>');
  process.exit(1);
}

// Path to the API config file
const configFilePath = path.join(__dirname, 'src', 'utils', 'apiConfig.js');

// Read the current content
let content = fs.readFileSync(configFilePath, 'utf8');

// Replace the placeholder with the actual domain
content = content.replace(
  'https://vinukatashidu.pythonanywhere.com/api',
  `https://${username}.pythonanywhere.com/api`
);

// Write the updated content back to the file
fs.writeFileSync(configFilePath, content, 'utf8');

console.log(`API configuration updated with domain: https://${username}.pythonanywhere.com/api`);
