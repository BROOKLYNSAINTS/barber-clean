// diagnostics.js - early bootstrap diagnostics
// Provides extra logging to help trace early native or TurboModule crashes.

// Tag console errors
const origError = console.error;
console.error = (...args) => {
  origError('[EARLY][ERROR]', ...args);
};

const origWarn = console.warn;
console.warn = (...args) => {
  origWarn('[EARLY][WARN]', ...args);
};

try {
  // Global JS error handler
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
    const existing = global.ErrorUtils.getGlobalHandler && global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((err, isFatal) => {
      origError('[EARLY][GLOBAL_HANDLER]', isFatal ? 'FATAL' : 'NON-FATAL', err?.message, err?.stack);
      if (existing && existing !== arguments.callee) {
        try { existing(err, isFatal); } catch (_) {}
      }
    });
  }
} catch (e) {
  origWarn('Failed to install global error handler', e);
}

// Environment snapshot
origWarn('Diagnostics bootstrap loaded', {
  jsEngine: global.HermesInternal ? 'hermes' : 'jsc',
  platform: Platform?.OS,
  date: new Date().toISOString(),
});
