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
    
    let apiUrl = '';
    let apiBody: BodyInit | null = null;

    if (action === 'classify') {
      apiUrl = "https://api.siliconflow.cn/v1/chat/completions";
      apiBody = JSON.stringify({
        model: "Qwen/Qwen2-7B-Instruct",
        messages: [{
          role: "user",
          content: `Is the following an English noun or a simple noun phrase that can be depicted as a single object? Answer only with "yes" or "no". Text: "${prompt}"`
        }],
        max_tokens: 5,
        temperature: 0
      });

    } else if (action === 'generate') {
      apiUrl = "https://api.siliconflow.cn/v1/images/generations";
      apiBody = JSON.stringify({
        model: "Kwai-Kolors/Kolors",
        prompt: `A simple, cute, cartoon-style icon of a "${prompt}". Centered on a clean, white background.`,
        response_format: "b64_json",
        n: 1,
        size: "1024x1024"
      });
    } else {
        return new Response(JSON.stringify({ error: 'Invalid action specified.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const siliconflowResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: apiBody
    });

    // Stream the response back to the client
    return new Response(siliconflowResponse.body, {
        status: siliconflowResponse.status,
        headers: {
            'Content-Type': siliconflowResponse.headers.get('Content-Type') || 'application/json',
        }
    });

  } catch (error) {
    console.error('Error in proxy worker:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
};
