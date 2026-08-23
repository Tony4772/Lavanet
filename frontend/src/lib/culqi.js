import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

let culqiReadyPromise = null;

function loadCulqiScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Culqi) return Promise.resolve(window.Culqi);
  if (culqiReadyPromise) return culqiReadyPromise;

  culqiReadyPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-culqi="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Culqi));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.culqi.com/js/v4";
    s.async = true;
    s.dataset.culqi = "1";
    s.onload = () => resolve(window.Culqi);
    s.onerror = () => reject(new Error("No se pudo cargar Culqi"));
    document.body.appendChild(s);
  });

  return culqiReadyPromise;
}

export function useCulqiPublicKey() {
  const [publicKey, setPublicKey] = useState(process.env.REACT_APP_CULQI_PUBLIC_KEY || "");

  useEffect(() => {
    if (publicKey) return;
    api
      .get("/api/superadmin/culqi-public-key")
      .then(({ data }) => setPublicKey(data?.data?.publicKey || ""))
      .catch(() => {});
  }, [publicKey]);

  return publicKey;
}

export function useCulqiToken(publicKey) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createToken = useCallback(
    async ({ cardNumber, cvv, expirationMonth, expirationYear, email }) => {
      if (!publicKey) throw new Error("Culqi no configurado");
      setLoading(true);
      setError("");
      try {
        const Culqi = await loadCulqiScript();
        Culqi.publicKey = publicKey;

        return await new Promise((resolve, reject) => {
          window.culqi = () => {
            if (window.Culqi.token) {
              resolve(window.Culqi.token.id);
            } else if (window.Culqi.error) {
              reject(new Error(window.Culqi.error.user_message || "Tarjeta inválida"));
            } else {
              reject(new Error("No se generó token"));
            }
            setLoading(false);
          };

          Culqi.createToken({
            card_number: cardNumber.replace(/\s/g, ""),
            cvv,
            expiration_month: expirationMonth,
            expiration_year: expirationYear,
            email,
          });
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [publicKey]
  );

  return { createToken, loading, error };
}
