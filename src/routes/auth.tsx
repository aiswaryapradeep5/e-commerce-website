import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/ecommerce";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign In — Axiom Store" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-display text-5xl uppercase">
        {mode === "signin" ? "Sign In" : "Create Account"}
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {mode === "signin" ? "Welcome back" : "Join the system"}
      </p>

      <button
        onClick={google}
        disabled={loading}
        className="mt-8 w-full border border-foreground px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Full name
            </label>
            <input
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-input bg-transparent px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-input bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-input bg-transparent px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-foreground px-4 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-primary disabled:opacity-50"
        >
          {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
      >
        {mode === "signin" ? "Need an account? Sign up →" : "Have an account? Sign in →"}
      </button>

      <Link
        to="/"
        className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
      >
        ← Back home
      </Link>
    </div>
  );
}
