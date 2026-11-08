/* Load the dictionary on demand; failed attempts can be retried without reloading. */
(function (root) {
  'use strict';
  let pending = null;
  function attempt(retry) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/words.js?v=2' + (retry ? '&retry=' + Date.now() : '');
      script.async = true;
      let settled = false;
      const timer = setTimeout(() => finish(new Error('Dictionary download timed out. Check your connection and tap Find words to retry.')), 30000);
      function finish(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        if (error) reject(error); else resolve(root.WORDS);
      }
      script.onload = () => finish(Array.isArray(root.WORDS) && root.WORDS.length ? null : new Error('The dictionary could not be read. Tap Find words to retry.'));
      script.onerror = () => finish(new Error('The dictionary download failed. Check your connection and tap Find words to retry.'));
      document.head.appendChild(script);
    });
  }
  root.loadWordDictionary = function () {
    if (Array.isArray(root.WORDS) && root.WORDS.length) return Promise.resolve(root.WORDS);
    if (!pending) {
      pending = attempt(false).catch(() => attempt(true)).catch(error => { pending = null; throw error; });
    }
    return pending;
  };
})(globalThis);
