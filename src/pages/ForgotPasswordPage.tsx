import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Clock, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import type { PageType } from "../App";

interface ForgotPasswordPageProps {
  onNavigate?: (page: PageType) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button 
            onClick={() => onNavigate?.("landing")}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
              <Clock className="w-7 h-7 text-purple-600" />
            </div>
            <span className="text-2xl text-white">TimeLink</span>
          </button>
          <h1 className="text-3xl text-white mb-2">
            {emailSent ? "Check your email" : "Forgot Password?"}
          </h1>
          <p className="text-white/80">
            {emailSent 
              ? "We've sent you a password reset link" 
              : "No worries, we'll send you reset instructions"
            }
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!emailSent ? (
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6"
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => onNavigate?.("login")}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> If you don't see the email in your inbox, please check your spam folder.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="text-xl text-gray-900 mb-2">Email sent!</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to<br />
                  <strong>{email}</strong>
                </p>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6"
                    onClick={() => onNavigate?.("reset-password")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Open Email Link (Demo)
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    Didn't receive? Resend
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => onNavigate?.("login")}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
