const fs = require('fs');

// Path to your template and output file
const templatePath = 'src/firebase-config.template.js';
const outputPath = 'src/firebase-config.js';

// Read the template file
let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders with environment variables from Netlify
template = template.replace(/__API_KEY__/g, process.env.VITE_FIREBASE_API_KEY);
template = template.replace(/__AUTH_DOMAIN__/g, process.env.VITE_FIREBASE_AUTH_DOMAIN);
template = template.replace(/__PROJECT_ID__/g, process.env.VITE_FIREBASE_PROJECT_ID);
template = template.replace(/__STORAGE_BUCKET__/g, process.env.VITE_FIREBASE_STORAGE_BUCKET);
template = template.replace(/__MESSAGING_SENDER_ID__/g, process.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
template = template.replace(/__APP_ID__/g, process.env.VITE_FIREBASE_APP_ID);

// Write the final config file
fs.writeFileSync(outputPath, template);

console.log('Successfully created firebase-config.js');