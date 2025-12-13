import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import type { PageType } from "../App";

interface HowItWorksPageProps {
  onNavigate?: (page: PageType) => void;
}
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  UserPlus, 
  Search, 
  BookOpen, 
  Clock, 
  Award,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up and tell us about your skills and what you'd like to learn. It takes just 2 minutes to get started.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    number: "02",
    icon: Search,
    title: "Browse & Connect",
    description: "Explore hundreds of skills offered by our community. Find the perfect match based on your interests and schedule.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Exchange Skills",
    description: "Teach what you know and learn what you want. Every hour you teach earns you time credits to spend on learning.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    number: "04",
    icon: Award,
    title: "Grow Together",
    description: "Build your profile, earn achievements, and become part of a thriving community of lifelong learners.",
    gradient: "from-green-500 to-emerald-500"
  }
];

const benefits = [
  "No money needed - trade time for time",
  "Learn from passionate experts in your community",
  "Flexible scheduling - learn at your own pace",
  "Build meaningful connections",
  "Safe and verified community members",
  "Track your progress and achievements"
];

const faqs = [
  {
    question: "How do time credits work?",
    answer: "For every hour you teach, you earn one time credit. You can then spend these credits to learn from others. It's a fair, equal exchange system."
  },
  {
    question: "What if I don't have any skills to teach?",
    answer: "Everyone has something valuable to share! Whether it's cooking, gardening, a language you speak, or professional expertise - all skills are welcome on TimeLink."
  },
  {
    question: "Can I learn and teach at the same time?",
    answer: "Absolutely! Most of our members are both teachers and students. You can offer your skills while simultaneously learning new ones."
  },
  {
    question: "Is TimeLink free to use?",
    answer: "Yes! Creating an account and exchanging skills is completely free. We believe in making learning accessible to everyone."
  },
  {
    question: "How do I get my first time credits?",
    answer: "New members receive 5 starter time credits to begin learning right away. You can also start teaching to earn more credits immediately."
  }
];

export function HowItWorksPage({ onNavigate }: HowItWorksPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-white mb-6">
            How TimeLink Works
          </h1>
          <p className="text-xl text-white/90 mb-8">
            A simple, fair way to exchange skills and build your community
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl px-8 py-6 rounded-full">
            Get Started Free
          </Button>
        </div>
      </div>
      
      {/* Steps Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
            Four Simple Steps
          </h2>
          <p className="text-lg text-gray-600">
            Start your learning journey in minutes
          </p>
        </div>
        
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div 
                key={index}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
              >
                <div className="flex-1">
                  <Card className="p-8 rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-shadow">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className={`text-6xl opacity-10 ${isEven ? '' : 'text-right'} mb-4`}>
                      {step.number}
                    </div>
                    
                    <h3 className="text-2xl text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 text-lg">
                      {step.description}
                    </p>
                  </Card>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`hidden md:block ${isEven ? '' : 'order-first'}`}>
                    <ArrowRight className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Time Credits Explanation */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl text-gray-900 mb-6">
                Understanding Time Credits
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Time credits are the currency of TimeLink. The system is beautifully simple:
              </p>
              
              <div className="space-y-4">
                <Card className="p-4 rounded-xl bg-blue-50 border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900">1 Hour Teaching = 1 Time Credit</p>
                      <p className="text-sm text-gray-600">Earn credits by sharing your knowledge</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 rounded-xl bg-purple-50 border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900">1 Time Credit = 1 Hour Learning</p>
                      <p className="text-sm text-gray-600">Spend credits to learn anything</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 border-0 shadow-2xl text-white">
              <h3 className="text-2xl mb-4">New Member Bonus</h3>
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-xl mb-2">Get 5 Free Time Credits</p>
              <p className="text-white/80 mb-6">
                Start learning immediately when you join TimeLink. No teaching required to get started!
              </p>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 w-full">
                Claim Your Bonus
              </Button>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Benefits Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
            Why Choose TimeLink?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <p className="text-gray-700">{benefit}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* FAQs Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6 rounded-2xl border-0 shadow-lg">
                <h3 className="text-lg text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of learners and teachers in our community
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl px-8 py-6 rounded-full">
            Create Free Account
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
