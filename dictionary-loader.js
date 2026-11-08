/* Fetch small JSON files only for the requested word lengths. */
(function (root) {
  'use strict';
  const requests = new Map();
  function loadError(message) {
    const error = new Error(message + ' Tap Find words to retry.');
    error.dictionaryLoad = true;
    return error;
  }
  async function attempt(length, retry) {
    const controller = new AbortController();
    let timer;
    try {
      const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          reject(loadError('Loading ' + length + '-letter words timed out. Check your connection.'));
          controller.abort();
        }, 20000);
      });
      const download = async () => {
        const url = 'assets/words-' + length + '.json?v=3' + (retry ? '&retry=' + Date.now() : '');
        let response;
        try {
          response = await fetch(url, {signal: controller.signal, cache: retry ? 'reload' : 'default'});
        } catch (error) {
          throw loadError('Could not download ' + length + '-letter words. Check your connection.');
        }
        if (!response.ok) throw loadError('The dictionary server returned HTTP ' + response.status + ' for ' + length + '-letter words.');
        let entries;
        try { entries = await response.json(); }
        catch (error) { throw loadError('The downloaded ' + length + '-letter dictionary was not valid JSON.'); }
        if (!Array.isArray(entries) || !entries.length || !entries.every(entry =>
          Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string' &&
          entry[0].length === length && /^[a-z]+$/.test(entry[0]) && Number.isInteger(entry[1]) && entry[1] >= 0
        )) throw loadError('The downloaded ' + length + '-letter dictionary had invalid entries.');
        return entries;
      };
      return await Promise.race([download(), timeout]);
    } finally { clearTimeout(timer); }
  }
  root.loadWordDictionary = async function (lengths) {
    const selected = [...new Set(lengths)];
    if (!selected.length || selected.some(n => !Number.isInteger(n) || n < 2 || n > 15)) throw new Error('Choose word lengths between 2 and 15.');
    const combined = [];
    // Load sequentially to keep network and memory use bounded on phones.
    for (const length of selected) {
      if (!requests.has(length)) {
        const request = attempt(length, false).catch(() => attempt(length, true)).catch(error => {
          requests.delete(length);
          throw error;
        });
        requests.set(length, request);
      }
      const entries = await requests.get(length);
      for (const entry of entries) combined.push(entry);
    }
    return combined;
  };
})(globalThis);
