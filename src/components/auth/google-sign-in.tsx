"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./google-icon";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  emulatorHost?: string;
}

const MESSAGES: Record<string, string> = {
  email_not_allowed: "Google didn't share a verified email address.",
  stale_sign_in: "That took too long. Please sign in again.",
  invalid_token: "Google sign-in didn't go through. Please try again.",
  not_configured: "Sign-in isn't set up on this server yet.",
};
const FALLBACK_MESSAGE = "Something went wrong signing in. Please try again.";

let emulatorConnected = false;

function firebaseAuth(config: FirebaseWebConfig): Auth {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  if (config.emulatorHost && !emulatorConnected) {
    connectAuthEmulator(auth, `http://${config.emulatorHost}`, { disableWarnings: true });
    emulatorConnected = true;
  }
  return auth;
}

function isPopupDismissed(error: unknown): boolean {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

export function GoogleSignIn({ config, next }: { config: FirebaseWebConfig; next: string }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signIn() {
    setWorking(true);
    setMessage(null);
    const auth = firebaseAuth(config);
    try {
      // The server's session cookie is the only session; nothing is kept in the browser.
      await setPersistence(auth, inMemoryPersistence);
      const provider = new GoogleAuthProvider();
      // hd replaces the account chooser with a domain-locked email form.
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken() }),
      });
      await signOut(auth);

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const code = typeof body === "object" && body !== null && "error" in body ? String(body.error) : "";
        setMessage(MESSAGES[code] ?? FALLBACK_MESSAGE);
        setWorking(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      setMessage(isPopupDismissed(error) ? null : FALLBACK_MESSAGE);
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={signIn} disabled={working} size="lg" className="w-full">
        <GoogleIcon className="size-5" />
        {working ? "Continuing…" : "Continue with Google"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-destructive">
        {message}
      </p>
    </div>
  );
}
