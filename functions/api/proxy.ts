// /functions/api/proxy.ts

// FIX: Define minimal types for Cloudflare Pages to resolve compilation errors.
// In a proper Cloudflare environment, these types would be provided automatically.
interface CloudflareRequest extends Request {
  json<T = any>(): Promise<T>;
}
type PagesFunction<Env = unknown> = (context: {
  request: CloudflareRequest;
  env: Env;
}) => Response | Promise<Response>;


interface Env {
  SILICONFLOW_API_KEY: string;
}

// Define the structure of the incoming request from the frontend
interface FrontendRequest {
  action: 'classify' | 'generate';
  prompt: string;
}

// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};


export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { action, prompt } = await request.json<FrontendRequest>();
    const apiKey = env.SILICONFLOW_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'classify') {
      const apiUrl = "https://api.siliconflow.cn/v1/chat/completions";
      const apiBody = JSON.stringify({
        model: "Qwen/Qwen2-7B-Instruct",
        messages: [{
          role: "user",
          content: `Is the following an English noun or a simple noun phrase that can be depicted as a single object? Answer only with "yes" or "no". Text: "${prompt}"`
        }],
        max_tokens: 5,
        temperature: 0
      });
      
      const siliconflowResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: apiBody
      });

      return new Response(siliconflowResponse.body, {
          status: siliconflowResponse.status,
          headers: {
              'Content-Type': siliconflowResponse.headers.get('Content-Type') || 'application/json',
          }
      });

    } else if (action === 'generate') {
      const apiUrl = "https://api.siliconflow.cn/v1/images/generations";
      const apiBody = JSON.stringify({
        model: "Qwen/Qwen-Image",
        prompt: `A simple, cute, cartoon-style icon of a "${prompt}". Centered on a clean, white background.`,
        n: 1,
        // Qwen model uses 'image_size' and has different recommended values
        image_size: "1328x1328", 
        cfg: 4.0
      });

      const siliconflowResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: apiBody
      });

      if (!siliconflowResponse.ok) {
        return new Response(siliconflowResponse.body, {
            status: siliconflowResponse.status,
            headers: { 'Content-Type': 'application/json' }
        });
      }

      // Qwen model returns a temporary URL, so we must fetch it and convert to base64
      const responseData = await siliconflowResponse.json() as { images: { url: string }[] };
      const imageUrl = responseData.images[0]?.url;

      if (!imageUrl) {
        throw new Error('Image URL not found in SiliconFlow response.');
      }

      // Fetch the image from the temporary URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image from temporary URL: ${imageResponse.statusText}`);
      }

      // Convert image to base64
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = arrayBufferToBase64(imageBuffer);

      // Send response back to the frontend in the format it expects
      const frontendResponse = {
        data: [{ b64_json: base64Image }]
      };

      return new Response(JSON.stringify(frontendResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
        return new Response(JSON.stringify({ error: 'Invalid action specified.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in proxy worker:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
