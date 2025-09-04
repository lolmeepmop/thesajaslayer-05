
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    setBusy(true);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Signed in successfully.");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account created. You are now signed in.");
      }
    }
    setBusy(false);
  };

  return (
    <div className="cosmic-card p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </div>
        {message && <div className="text-sm text-muted-foreground">{message}</div>}
        <div className="flex gap-2">
          <Button type="submit" className="cosmic-button" disabled={busy}>
            {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            disabled={busy}
          >
            {mode === "signin" ? "Create account" : "Have an account? Sign in"}
          </Button>
        </div>
      </form>
      <p className="text-xs text-muted-foreground mt-4">
        After signing up, grant your user the admin role in Supabase to access the Stats page.
      </p>
    </div>
  );
};

export default LoginForm;
