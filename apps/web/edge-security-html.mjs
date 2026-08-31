/**
 * Conservative HTML nonce tokenizer used when Cloudflare HTMLRewriter is not
 * available (for example, local Node-based tests and non-edge previews).
 */

const isWhitespace = (character) =>
  character === ' ' ||
  character === '\t' ||
  character === '\n' ||
  character === '\r' ||
  character === '\f';

const findTagEnd = (html, start) => {
  let quote = '';

  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }

  return -1;
};

const readOpeningTag = (html, openIndex, endIndex) => {
  const nameStart = openIndex + 1;
  const firstCharacter = html[nameStart];
  if (
    firstCharacter === '/' ||
    firstCharacter === '!' ||
    firstCharacter === '?' ||
    firstCharacter === undefined
  ) {
    return null;
  }

  let nameEnd = nameStart;
  while (nameEnd < endIndex) {
    const character = html[nameEnd];
    if (isWhitespace(character) || character === '/' || character === '>') {
      break;
    }
    nameEnd += 1;
  }

  if (nameEnd === nameStart) return null;

  return {
    name: html.slice(nameStart, nameEnd),
    nameEnd,
  };
};

const readAttributeEnd = (attributes, start) => {
  let cursor = start;
  while (cursor < attributes.length && isWhitespace(attributes[cursor])) {
    cursor += 1;
  }

  if (
    cursor >= attributes.length ||
    attributes[cursor] === '/' ||
    attributes[cursor] === '>'
  ) {
    return cursor;
  }

  while (
    cursor < attributes.length &&
    !isWhitespace(attributes[cursor]) &&
    attributes[cursor] !== '=' &&
    attributes[cursor] !== '/' &&
    attributes[cursor] !== '>'
  ) {
    cursor += 1;
  }

  while (cursor < attributes.length && isWhitespace(attributes[cursor])) {
    cursor += 1;
  }

  if (attributes[cursor] === '=') {
    cursor += 1;
    while (cursor < attributes.length && isWhitespace(attributes[cursor])) {
      cursor += 1;
    }

    const quote = attributes[cursor];
    if (quote === '"' || quote === "'") {
      cursor += 1;
      while (cursor < attributes.length && attributes[cursor] !== quote) {
        cursor += 1;
      }
      if (cursor < attributes.length) cursor += 1;
    } else {
      while (cursor < attributes.length && !isWhitespace(attributes[cursor])) {
        cursor += 1;
      }
    }
  }

  return cursor;
};

const removeNonceAttributes = (attributes) => {
  let cursor = 0;
  let output = '';

  while (cursor < attributes.length) {
    const tokenStart = cursor;
    while (cursor < attributes.length && isWhitespace(attributes[cursor])) {
      cursor += 1;
    }

    const nameStart = cursor;
    while (
      cursor < attributes.length &&
      !isWhitespace(attributes[cursor]) &&
      attributes[cursor] !== '=' &&
      attributes[cursor] !== '/' &&
      attributes[cursor] !== '>'
    ) {
      cursor += 1;
    }

    if (nameStart === cursor) {
      output += attributes.slice(tokenStart);
      break;
    }

    const attributeEnd = readAttributeEnd(attributes, nameStart);
    const name = attributes.slice(nameStart, cursor).toLowerCase();
    if (name !== 'nonce') {
      output += attributes.slice(tokenStart, attributeEnd);
    }
    cursor = attributeEnd;
  }

  return output;
};

const escapeAttributeValue = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const rewriteOpeningTag = (html, endIndex, tag, nonce) => {
  const attributes = html.slice(tag.nameEnd, endIndex);
  const cleanedAttributes = removeNonceAttributes(attributes);
  return `<${tag.name} nonce="${escapeAttributeValue(nonce)}"${cleanedAttributes}>`;
};

const findClosingTag = (lowerHtml, start, tagName) => {
  const needle = `</${tagName}`;
  let cursor = lowerHtml.indexOf(needle, start);

  while (cursor !== -1) {
    const boundary = lowerHtml[cursor + needle.length];
    if (boundary === undefined || isWhitespace(boundary) || boundary === '>') {
      return cursor;
    }
    cursor = lowerHtml.indexOf(needle, cursor + needle.length);
  }

  return -1;
};

/**
 * Tokenizes opening tags and skips script/style bodies so tag-like strings in
 * JavaScript or CSS are never treated as markup.
 */
export const rewriteHtmlTags = (html, nonce) => {
  const lowerHtml = html.toLowerCase();
  const output = [];
  let cursor = 0;

  while (cursor < html.length) {
    const openIndex = html.indexOf('<', cursor);
    if (openIndex === -1) {
      output.push(html.slice(cursor));
      break;
    }

    output.push(html.slice(cursor, openIndex));
    const endIndex = findTagEnd(html, openIndex + 1);
    if (endIndex === -1) {
      output.push(html.slice(openIndex));
      break;
    }

    const tag = readOpeningTag(html, openIndex, endIndex);
    const tagName = tag?.name.toLowerCase();
    if (tag && (tagName === 'script' || tagName === 'style')) {
      output.push(rewriteOpeningTag(html, endIndex, tag, nonce));
      const closingIndex = findClosingTag(lowerHtml, endIndex + 1, tagName);
      if (closingIndex === -1) {
        output.push(html.slice(endIndex + 1));
        break;
      }
      output.push(html.slice(endIndex + 1, closingIndex));
      cursor = closingIndex;
      continue;
    }

    output.push(html.slice(openIndex, endIndex + 1));
    cursor = endIndex + 1;
  }

  return output.join('');
};
