"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'magic'>('password');
  
  useEffect(() => {
    // Prüfe ob es eine Einladung ist
    const inviteEmail = searchParams.get('email');
    const isInvite = searchParams.get('invite');
    
    if (inviteEmail && isInvite) {
      setMagicLinkEmail(inviteEmail);
      setActiveTab('magic');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-Mail oder Passwort ist falsch");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const result = await signIn("email", {
        email: magicLinkEmail,
        redirect: false,
      });
      
      if (result?.ok) {
        setMagicLinkSent(true);
      } else {
        setError("Fehler beim Senden des Magic Links");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            MGA Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Melden Sie sich in Ihrem Konto an
          </p>
        </div>

        {!magicLinkSent ? (
          <>
            {/* Tab Navigation */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <Button
                type="button"
                variant={activeTab === 'password' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => setActiveTab('password')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Mit Passwort
              </Button>
              <Button
                type="button"
                variant={activeTab === 'magic' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => setActiveTab('magic')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Magic Link
              </Button>
            </div>

            {/* Password Login Form */}
            {activeTab === 'password' && (
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <Label htmlFor="email" className="sr-only">
                      E-Mail Adresse
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="rounded-none rounded-t-md"
                      placeholder="E-Mail Adresse"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="sr-only">
                      Passwort
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="rounded-none rounded-b-md -mt-px"
                      placeholder="Passwort"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Wird angemeldet..." : "Anmelden"}
                  </Button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Oder</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => signIn('google', { callbackUrl: '/' })}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                      Mit Google anmelden
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Magic Link Form */}
            {activeTab === 'magic' && (
              <form className="mt-8 space-y-6" onSubmit={handleMagicLink}>
                <div>
                  <Label htmlFor="magic-email" className="mb-2">
                    E-Mail Adresse
                  </Label>
                  <Input
                    id="magic-email"
                    name="magic-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="ihre.email@beispiel.de"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                  />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Wir senden Ihnen einen sicheren Link zum Anmelden ohne Passwort.
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Sende Link..." : "Magic Link senden"}
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Magic Link gesendet!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Wir haben einen sicheren Anmeldelink an <strong>{magicLinkEmail}</strong> gesendet.
              <br />
              Bitte überprüfen Sie Ihre E-Mail und klicken Sie auf den Link, um sich anzumelden.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setMagicLinkSent(false);
                setMagicLinkEmail("");
              }}
            >
              Neue E-Mail eingeben
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}