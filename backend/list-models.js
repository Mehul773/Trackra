const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not defined in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.error) {
      console.error('❌ API Error:', data.error);
      return;
    }
    console.log('✅ Connected successfully! Here are the available models:');
    data.models.forEach((model) => {
      console.log(`- ${model.name} (displayName: ${model.displayName})`);
    });
  } catch (error) {
    console.error('❌ Error listing models:', error);
  }
}

run();
