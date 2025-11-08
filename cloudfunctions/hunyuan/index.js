const tcb = require('@cloudbase/node-sdk');
const { hunyuan } = require("tencentcloud-sdk-nodejs");

const HunyuanClient = hunyuan.v20230901.Client;

// --- ACTION REQUIRED ---
// For this function to work, you must configure environment variables in the TCB console.
// 1. Go to CloudBase Console -> Functions -> 'hunyuan' -> Function Configuration -> Edit.
// 2. In the "Environment Variables" section, add two variables:
//    - TENCENT_SECRET_ID: Your Tencent Cloud Secret ID (e.g., AKID...)
//    - TENCENT_SECRET_KEY: Your Tencent Cloud Secret Key
// These are used to securely call the Hunyuan AI API.
// Also, ensure the function has the 'tencentcloud-sdk-nodejs' dependency installed.

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: "ap-guangzhou", // Hunyuan API is available in the Guangzhou region
  profile: {
    httpProfile: {
      endpoint: "hunyuan.tencentcloudapi.com",
    },
  },
};

const client = new HunyuanClient(clientConfig);
const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });

exports.main = async (event, context) => {
  const { promptText } = event;

  if (!promptText) {
    return { error: "Prompt text is required." };
  }
  
  try {
    // Step 1: Classify the prompt using Hunyuan Chat
    const chatParams = {
      Model: "hunyuan-standard",
      Messages: [
        {
          Role: "user",
          Content: `Is the following an English noun or a simple noun phrase that can be depicted as a single object? Answer only with "yes" or "no". Text: "${promptText}"`,
        },
      ],
    };
    const chatResponse = await client.ChatStd(chatParams);
    const classification = chatResponse.Choices[0].Message.Content.trim().toLowerCase();
    
    const isNoun = classification.includes('yes');

    // Step 2: Generate image or return text
    if (isNoun) {
      const imageParams = {
        Prompt: `A simple, cute, cartoon-style icon of a "${promptText}". Centered on a clean, white background.`,
        Style: "cartoon"
      };
      const imageResponse = await client.TextToImage(imageParams);
      // The image is returned as a base64 string in the response's ResultData field.
      return { type: 'image', content: imageResponse.ResultData };
    } else {
      return { type: 'text', content: promptText };
    }
  } catch (err) {
    console.error("Hunyuan API error:", err);
    // Fallback to text note on error
    return { type: 'text', content: promptText, error: err.toString() };
  }
};
