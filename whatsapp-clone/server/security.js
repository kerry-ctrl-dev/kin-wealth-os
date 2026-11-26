'use strict';

const https = require('https');

const FIREBASE_LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';
const MAX_ID_TOKEN_LENGTH = 8192;
const MAX_DISPLAY_NAME_LENGTH = 80;

function requestFirebaseAccount(apiKey, idToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(FIREBASE_LOOKUP_URL);
    url.searchParams.set('key', apiKey);

    const request = https.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      (response) => {
        let responseText = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          responseText += chunk;
          if (responseText.length > 65536) {
            request.destroy(new Error('Firebase response exceeded the allowed size.'));
          }
        });
        response.on('end', () => {
          let body = null;
          try {
            body = JSON.parse(responseText);
          } catch {
            // Invalid provider responses fail closed in verifyFirebaseIdToken.
          }
          resolve({ statusCode: response.statusCode, body });
        });
      },
    );

    request.setTimeout(5000, () => request.destroy(new Error('Firebase verification timed out.')));
    request.on('error', reject);
    request.end(JSON.stringify({ idToken }));
  });
}

async function verifyFirebaseIdToken(
  idToken,
  apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  lookup = requestFirebaseAccount,
) {
  if (
    typeof apiKey !== 'string' ||
    apiKey.length === 0 ||
    typeof idToken !== 'string' ||
    idToken.length === 0 ||
    idToken.length > MAX_ID_TOKEN_LENGTH
  ) {
    return null;
  }

  try {
    const result = await lookup(apiKey, idToken);
    const firebaseUser = result?.body?.users?.[0];
    if (result?.statusCode !== 200 || typeof firebaseUser?.localId !== 'string' || !firebaseUser.localId) {
      return null;
    }

    const emailName = typeof firebaseUser.email === 'string' ? firebaseUser.email.split('@')[0] : '';
    const providedName = typeof firebaseUser.displayName === 'string' ? firebaseUser.displayName : '';
    const displayName = (providedName || emailName || 'User').slice(0, MAX_DISPLAY_NAME_LENGTH);

    return { uid: firebaseUser.localId, displayName };
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (typeof origin !== 'string' || !Array.isArray(allowedOrigins)) return false;

  let requestOrigin;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  return allowedOrigins.some((allowed) => {
    if (typeof allowed !== 'string' || allowed.length === 0) return false;
    try {
      return new URL(allowed).origin === requestOrigin;
    } catch {
      return false;
    }
  });
}

function isSafeSignal(signal, maxBytes = 16384) {
  if (signal === null || typeof signal !== 'object' || Array.isArray(signal)) return false;
  try {
    return Buffer.byteLength(JSON.stringify(signal), 'utf8') <= maxBytes;
  } catch {
    return false;
  }
}

module.exports = { isAllowedOrigin, isSafeSignal, verifyFirebaseIdToken };