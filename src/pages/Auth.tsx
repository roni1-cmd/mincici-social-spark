import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-serif font-light tracking-tight">
              Impossible?
            </h1>
            <h2 className="text-6xl font-serif font-light tracking-tight">
              Possible.
            </h2>
            <p className="text-muted-foreground mt-6">
              The AI for problem solvers
            </p>
          </div>

          <div className="space-y-4 bg-card/50 backdrop-blur border border-border rounded-2xl p-8">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background/50"
              />

              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background/50"
              />

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  "Sign Up"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you acknowledge mincici's Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 items-end justify-center p-12 relative overflow-hidden">
        <div className="absolute top-8 left-8 right-8 flex justify-center">
          <svg className="w-64 h-8" viewBox="0 0 400 50">
            <path
              d="M 20,25 Q 50,10 80,25 T 140,25 Q 170,10 200,25 T 260,25 Q 290,10 320,25 T 380,25"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-md">
          <div className="bg-gradient-to-t from-orange-700/40 to-transparent p-8 rounded-t-3xl">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-700 flex items-end justify-center">
                <div className="text-center text-white p-8">
                  <p className="text-lg font-light">Welcome to mincici</p>
                  <p className="text-sm opacity-75 mt-2">Share your thoughts with the world</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
