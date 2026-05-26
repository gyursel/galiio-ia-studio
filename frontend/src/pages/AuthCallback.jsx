import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { exchangeSession } from "@/lib/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const session_id = params.get("session_id");

    if (!session_id) {
      navigate("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const user = await exchangeSession(session_id);
        setUser(user);
        // Clear hash and redirect
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { replace: true, state: { user } });
      } catch (e) {
        setError("Sign-in failed. Please try again.");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-zinc-950 grid place-items-center text-zinc-300">
      <div className="text-center">
        <div className="mx-auto w-10 h-10 rounded-full border border-zinc-800 grid place-items-center ai-pulse">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <p className="mt-5 text-sm tracking-tight">
          {error || "Signing you in…"}
        </p>
      </div>
    </div>
  );
}
