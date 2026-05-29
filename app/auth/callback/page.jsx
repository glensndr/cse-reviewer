"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../../../src/supabaseClient";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing Gmail sign in...");

  useEffect(() => {
    async function completeOAuth() {
      if (!supabaseConfigured || !supabase) {
        setMessage("Supabase is not configured. Add the Supabase URL and anon key, then try again.");
        return;
      }

      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get("error");
      const oauthErrorDescription = url.searchParams.get("error_description");
      const code = url.searchParams.get("code");

      if (oauthError) {
        setMessage(oauthErrorDescription || oauthError);
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage(`Unable to complete Gmail login: ${error.message}`);
            return;
          }
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            setMessage(error?.message || "No OAuth code or active session was found. Please start Gmail login again.");
            return;
          }
        }

        window.history.replaceState({}, document.title, "/auth/callback");
        window.location.replace("/");
      } catch (error) {
        setMessage(error?.message || "Unexpected OAuth callback error. Please try Gmail login again.");
      }
    }

    completeOAuth();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg,#06131f,#101827 45%,#11130f)",
      color: "white",
      fontFamily: "Inter, system-ui, Segoe UI, Arial"
    }}>
      <section style={{
        width: "min(92vw, 560px)",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 28,
        padding: 28,
        background: "rgba(255,255,255,.08)",
        textAlign: "center"
      }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Gmail Login</h1>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>{message}</p>
      </section>
    </main>
  );
}
