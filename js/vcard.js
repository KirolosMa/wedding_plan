// Minimal vCard reader for contact files exported from iOS/iCloud (vCard 2.1, 3.0 and 4.0).
// Only the pieces the guest importer needs: display name and phone numbers.

function decodeQuotedPrintable(value) {
  const encoder = new TextEncoder();
  const bytes = [];
  for (let i = 0; i < value.length; i += 1) {
    const hex = value.slice(i + 1, i + 3);
    if (value[i] === '=' && /^[0-9a-f]{2}$/i.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(...encoder.encode(value[i]));
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

function decodeValue(value, params) {
  const decoded = /ENCODING=QUOTED-PRINTABLE/i.test(params) ? decodeQuotedPrintable(value) : value;
  return decoded.replace(/\\([,;\\])/g, '$1').trim();
}

function nameFromStructured(value) {
  const [last = '', first = '', middle = ''] = value.split(';');
  return [first, middle, last].filter(Boolean).join(' ').trim();
}

export function parseVCards(text) {
  const lines = [];
  for (const line of String(text ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const previous = lines[lines.length - 1];
    // Long values are folded onto continuation lines starting with a space...
    if (previous !== undefined && /^[ \t]/.test(line)) {
      lines[lines.length - 1] = previous + line.slice(1);
      continue;
    }
    // ...while quoted-printable values (vCard 2.1) instead end the line with '='.
    if (previous !== undefined && previous.endsWith('=') && /ENCODING=QUOTED-PRINTABLE/i.test(previous)) {
      lines[lines.length - 1] = previous.slice(0, -1) + line;
      continue;
    }
    lines.push(line);
  }

  const cards = [];
  let card = null;

  for (const line of lines) {
    if (/^BEGIN:VCARD/i.test(line)) {
      card = { fn: '', n: '', phones: [] };
      continue;
    }
    if (/^END:VCARD/i.test(line)) {
      if (card) {
        const name = card.fn || nameFromStructured(card.n);
        if (name) cards.push({ name, phones: card.phones });
      }
      card = null;
      continue;
    }
    if (!card) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const head = line.slice(0, colon);
    const value = line.slice(colon + 1);
    // Property names can carry a group prefix ("item1.TEL") and parameters ("TEL;TYPE=CELL").
    const [rawName, ...params] = head.split(';');
    const property = rawName.split('.').pop().toUpperCase();

    if (property === 'FN') card.fn = decodeValue(value, head);
    else if (property === 'N') card.n = decodeValue(value, head);
    else if (property === 'TEL') {
      const number = decodeValue(value, head).replace(/^tel:/i, '');
      if (number) card.phones.push({ number, mobile: /CELL|IPHONE|MOBILE/i.test(params.join(';')) });
    }
  }

  return cards;
}

// One number per contact: a mobile if the card labels one, otherwise the first listed.
export function preferredPhone(card) {
  return (card.phones.find((p) => p.mobile) ?? card.phones[0])?.number ?? null;
}
