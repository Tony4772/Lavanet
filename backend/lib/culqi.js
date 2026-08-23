const CULQI_BASE = "https://api.culqi.com/v2";

const getSecretKey = () => {
  const key = process.env.CULQI_SECRET_KEY;
  if (!key) throw new Error("CULQI_SECRET_KEY no configurado");
  return key;
};

async function culqiRequest(path, options = {}) {
  const res = await fetch(`${CULQI_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.merchant_message || data?.user_message || data?.message || res.statusText;
    const err = new Error(msg || "Error Culqi");
    err.status = res.status;
    err.culqi = data;
    throw err;
  }
  return data;
}

exports.createCustomer = (payload) =>
  culqiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

exports.createCard = (payload) =>
  culqiRequest("/cards", {
    method: "POST",
    body: JSON.stringify(payload),
  });

exports.createCharge = (payload) =>
  culqiRequest("/charges", {
    method: "POST",
    body: JSON.stringify(payload),
  });

exports.createOrder = (payload) =>
  culqiRequest("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

exports.getPublicKey = () => process.env.CULQI_PUBLIC_KEY || "";
