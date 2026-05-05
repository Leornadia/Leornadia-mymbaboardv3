const HOTKUP_SUBMISSION_URL = 'https://smart.hotkup.com/external-forms/submission';
const HOTKUP_FORM_MASTER_ID = '69f3b2fb08c8584502a6c80e';

const allowedOrigins = new Set([
  'https://leornadia.github.io',
  'https://smart.hotkup.com'
]);

const fields = [
  ['firstName', 'hotkup_form_field_1774948797233464713', 'text', true],
  ['lastName', 'hotkup_form_field_177494880507964358', 'text', true],
  ['email', 'hotkup_form_field_1774948812181319585', 'text', true],
  ['phone', 'hotkup_form_field_1774948882750996521', 'number', true],
  ['address', 'hotkup_form_field_1774948894928306885', 'text', true],
  ['companyName', 'hotkup_form_field_1774948954207626358', 'text', true],
  ['position', 'hotkup_form_field_177494899456872748', 'text', true],
  ['employees', 'hotkup_form_field_1774949019704952091', 'text', true],
  ['monthsInOperation', 'hotkup_form_field_1774949068749620783', 'text', true],
  ['turnover', 'hotkup_form_field_1774949097034244579', 'text', true],
  ['regNo', 'hotkup_form_field_177494919717428034', 'number', false]
];

function setCors(req, res) {
  const origin = req.headers.origin;
  const isVercelPreview = origin && /^https:\/\/[^/]+\.vercel\.app$/.test(origin);
  if (allowedOrigins.has(origin) || isVercelPreview) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await readJson(req);
    const missing = fields
      .filter(([key, , , required]) => required && !String(body[key] || '').trim())
      .map(([key]) => key);

    if (missing.length) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing required fields', missing }));
      return;
    }

    const payload = {
      id: 'new',
      formMasterId: HOTKUP_FORM_MASTER_ID,
      fields: fields
        .map(([key, name, type]) => ({
          name,
          type,
          value: String(body[key] || '').trim()
        }))
        .filter(field => field.value),
      tabularFieldsDataMap: {},
      clientTimeZone: body.clientTimeZone || 'Africa/Johannesburg'
    };

    const hotkupResponse = await fetch(HOTKUP_SUBMISSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await hotkupResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { raw: text };
    }

    if (!hotkupResponse.ok || data.status >= 400) {
      res.statusCode = hotkupResponse.status || 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'HotKup submission failed', details: data }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      submissionId: data?.data?.form_data?.externalFormSubmissionId || data?.data?.form_data?.id || null
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Submission failed', message: error.message }));
  }
};
