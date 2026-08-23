import { useEffect, useState } from "react";
import { api } from "./api";

let checkoutReadyPromise = null;

function loadCulqiCheckoutScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.CulqiCheckout) return Promise.resolve(window.CulqiCheckout);
  if (checkoutReadyPromise) return checkoutReadyPromise;

  checkoutReadyPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-culqi-checkout="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.CulqiCheckout));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.culqi.com/checkout-js";
    s.async = true;
    s.dataset.culqiCheckout = "1";
    s.onload = () => resolve(window.CulqiCheckout);
    s.onerror = () => reject(new Error("No se pudo cargar Culqi Checkout"));
    document.body.appendChild(s);
  });

  return checkoutReadyPromise;
}

export function useCulqiPublicKey(endpoint = "/api/billing/culqi-public-key") {
  const [publicKey, setPublicKey] = useState(process.env.REACT_APP_CULQI_PUBLIC_KEY || "");

  useEffect(() => {
    if (publicKey) return;
    api
      .get(endpoint)
      .then(({ data }) => setPublicKey(data?.data?.publicKey || ""))
      .catch(() => {});
  }, [publicKey, endpoint]);

  return publicKey;
}

/** Abre el checkout oficial de Culqi (tarjeta / Yape). */
export async function openCulqiCheckout(session) {
  const CulqiCheckout = await loadCulqiCheckoutScript();
  const publicKey = session?.publicKey;
  if (!publicKey) throw new Error("Culqi no configurado");

  const config = {
    settings: session.settings,
    client: session.client,
    options: session.options,
  };

  return new Promise((resolve, reject) => {
    const checkout = new CulqiCheckout(publicKey, config);

    checkout.culqi = () => {
      if (checkout.token?.id) {
        checkout.close?.();
        resolve({
          tokenId: checkout.token.id,
          email: checkout.token.email || session.client?.email,
        });
        return;
      }
      if (checkout.error) {
        reject(new Error(checkout.error.user_message || checkout.error.merchant_message || "Pago cancelado"));
        return;
      }
      reject(new Error("No se completó el pago en Culqi"));
    };

    checkout.open();
  });
}
