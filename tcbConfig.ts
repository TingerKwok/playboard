// @ts-nocheck

// --- ACTION REQUIRED ---
// 1. Go to the Tencent CloudBase console: https://console.cloud.tencent.com/tcb/env/index
// 2. Create a new environment (or use an existing one).
// 3. Find your Environment ID on the environment overview page.
// 4. Replace the placeholder below with your Environment ID.

const TCB_ENV_ID = "cloud1-0g4tjpgk51a8e6d9"; // e.g., "play-board-a1b2c3d"

export const isTcbConfigured = TCB_ENV_ID !== "YOUR_TCB_ENVIRONMENT_ID";

let tcbApp;

if (isTcbConfigured) {
  try {
    // The 'tcb' object is globally available from the SDK script in index.html.
    // We explicitly use `window.tcb` to ensure we're accessing the global object
    // from within this module, resolving the "tcb is not defined" error.
    tcbApp = window.tcb.init({
      env: TCB_ENV_ID,
    });
  } catch (e) {
    console.error("Tencent CloudBase initialization error. Please check your TCB_ENV_ID in tcbConfig.ts", e);
  }
} else {
  console.warn("Tencent CloudBase is not configured. Please update tcbConfig.ts with your Environment ID.");
}

export { tcbApp };