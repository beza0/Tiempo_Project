import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Clock, CheckCircle, Eye, EyeOff } from "lucide-react";
import type { PageType } from "../App";

interface ResetPasswordPageProps {
  onNavigate?: (page: PageType) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword && password.length >= 8) {
      setPasswordReset(true);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const passwordLengthValid = password.length >= 8;

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
            {passwordReset ? "Password Reset!" : "Reset Password"}
          </h1>
          <p className="text-white/80">
            {passwordReset 
              ? "Your password has been successfully reset" 
              : "Please enter your new password"
            }
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!passwordReset ? (
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative mt-2">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {password && !passwordLengthValid && (
                    <p className="text-xs text-red-500 mt-1">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative mt-2">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6"
                  disabled={!passwordsMatch || !passwordLengthValid}
                >
                  Reset Password
                </Button>
              </form>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">
                  Password must:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={`flex items-center gap-2 ${passwordLengthValid ? 'text-green-600' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passwordLengthValid ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                    Be at least 8 characters long
                  </li>
                  <li className={`flex items-center gap-2 ${passwordsMatch && confirmPassword ? 'text-green-600' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch && confirmPassword ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                    Match in both fields
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h3 className="text-xl text-gray-900 mb-2">All set!</h3>
                <p className="text-gray-600 mb-6">
                  Your password has been successfully reset.<br />
                  You can now sign in with your new password.
                </p>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6"
                  onClick={() => onNavigate?.("login")}
                >
                  Continue to Sign In
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
