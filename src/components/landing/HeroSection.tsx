import { Button } from "../ui/button";
import { Clock, Users, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 animate-pulse">
          <Clock className="w-16 h-16 text-white" />
        </div>
        <div className="absolute top-40 right-20 animate-pulse delay-75">
          <Users className="w-20 h-20 text-white" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-pulse delay-150">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute bottom-20 right-1/3 animate-pulse delay-100">
          <Clock className="w-14 h-14 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
            Time-Based Skill Exchange Platform
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 tracking-tight">
          Trade Skills. <br />
          <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
            Earn Time.
          </span>{" "}
          <br />
          Learn Anything.
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
          Exchange your skills with others using time credits. No money needed. 
          Just your expertise and passion to learn.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl px-8 py-6 rounded-full"
          >
            Join Now
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 rounded-full"
          >
            How It Works
          </Button>
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm sm:text-base">10,000+ Active Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm sm:text-base">50+ Skill Categories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <span className="text-sm sm:text-base">1M+ Hours Exchanged</span>
          </div>
        </div>
      </div>
    </section>
  );
}
