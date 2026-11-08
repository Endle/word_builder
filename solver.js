/* Pure solver shared by the page and regression tests. */
(function (root) {
  'use strict';
  function counts(text) {
    const result = new Uint8Array(26);
    for (const ch of text) result[ch.charCodeAt(0) - 97]++;
    return result;
  }
  function validate(input) {
    const letters = input.letters.toLowerCase().replace(/\s/g, '');
    if (!/^[a-z]{2,20}$/.test(letters)) throw new Error('Enter 2–20 English letters (A–Z). Spaces are okay.');
    const length = Number(input.length);
    if (!Number.isInteger(length) || (length !== 0 && (length < 2 || length > 15))) throw new Error('Choose a word length between 2 and 15, or Any.');
    const starts = (input.starts || '').toLowerCase().trim();
    const ends = (input.ends || '').toLowerCase().trim();
    const pattern = (input.pattern || '').toLowerCase().replace(/\s/g, '').replace(/\?/g, '_');
    if (!/^[a-z]*$/.test(starts + ends)) throw new Error('Starting and ending letters must contain only A–Z.');
    if (!/^[a-z_]*$/.test(pattern)) throw new Error('Use only letters, underscores, or question marks in the pattern.');
    const size = length || pattern.length;
    if (length && pattern && pattern.length !== length) throw new Error('Your pattern must have exactly ' + length + ' positions.');
    if ((size && (starts.length > size || ends.length > size)) || size > letters.length) throw new Error('The word length and known positions must fit your available letters.');
    if (size) {
      const positions = Array.from({length:size}, (_, i) => pattern[i] === '_' ? '' : (pattern[i] || ''));
      function place(text, offset) { for (let i=0;i<text.length;i++) { if (positions[i+offset] && positions[i+offset] !== text[i]) throw new Error('Your known positions conflict. Check the pattern, start, and end.'); positions[i+offset]=text[i]; } }
      place(starts,0); place(ends,size-ends.length);
      const needed = counts(positions.join('')), available = counts(letters);
      if (needed.some((n,i)=>n>available[i])) throw new Error('The known positions require letters that are not available.');
    }
    return {letters, length, starts, ends, pattern, commonOnly:!!input.commonOnly};
  }
  function search(dictionary, raw, excluded = new Set(), sort = 'common') {
    const q=validate(raw), available=counts(q.letters);
    const matches=dictionary.filter(entry=>{
      const word=entry[0], rank=entry[1];
      if (excluded.has(word) || word.length>q.letters.length || (q.length && word.length!==q.length) || (q.commonOnly && (!rank || rank>15000))) return false;
      if (!word.startsWith(q.starts) || !word.endsWith(q.ends)) return false;
      if (q.pattern && (word.length!==q.pattern.length || [...q.pattern].some((c,i)=>c!=='_' && word[i]!==c))) return false;
      const used=counts(word);
      return used.every((n,i)=>n<=available[i]);
    });
    return matches.sort((a,b)=> (sort==='alpha' ? 0 : sort==='longest' ? b[0].length-a[0].length : (a[1]||Infinity)-(b[1]||Infinity)) || a[0].localeCompare(b[0]));
  }
  root.WordSolver={validate,search};
})(globalThis);
