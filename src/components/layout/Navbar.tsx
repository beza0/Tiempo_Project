import { Button } from "../ui/button";
import { Clock, Menu } from "lucide-react";
import { useState } from "react";
import type { PageType } from "../../App";

interface NavbarProps {
  onNavigate?: (page: PageType) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (page: PageType) => {
    if (onNavigate) {
      onNavigate(page);
      setIsMenuOpen(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavigate("landing")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">TimeLink</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleNavigate("browse")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Browse Skills
            </button>
            <button 
              onClick={() => handleNavigate("how-it-works")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => handleNavigate("dashboard")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavigate("messages")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Messages
            </button>
            <button 
              onClick={() => handleNavigate("profile")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Profile
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost"
              onClick={() => handleNavigate("login")}
            >
              Sign In
            </Button>
            <Button 
              onClick={() => handleNavigate("signup")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleNavigate("browse")}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                Browse Skills
              </button>
              <button 
                onClick={() => handleNavigate("how-it-works")}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => handleNavigate("dashboard")}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigate("messages")}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                Messages
              </button>
              <button 
                onClick={() => handleNavigate("profile")}
                className="text-left text-gray-600 hover:text-gray-900 transition-colors"
              >
                Profile
              </button>
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => handleNavigate("login")}
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => handleNavigate("signup")}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
