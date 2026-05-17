const crypto = require('crypto');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildSignature = (params, apiSecret) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
};

const uploadImage = async (file, folder = 'doctors') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw createError('Cloudinary is not configured', 500);
  }

  if (typeof fetch !== 'function' || typeof FormData !== 'function') {
    throw createError('Current Node runtime does not support image upload', 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { folder, timestamp };
  const signature = buildSignature(signedParams, apiSecret);
  const formData = new FormData();

  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.secure_url) {
    const message = payload?.error?.message || 'Unable to upload image to Cloudinary';
    throw createError(message, response.status || 500);
  }

  return payload.secure_url;
};

module.exports = {
  uploadImage,
};
