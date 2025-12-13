import { Card } from "../ui/card";
import { Handshake, Clock, Heart } from "lucide-react";

const features = [
  {
    icon: Handshake,
    title: "Offer Your Skills",
    description: "Share what you're great at - from cooking to coding, teaching to tutoring. Every skill has value.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Clock,
    title: "Earn Time Credits",
    description: "For every hour you teach or help others, you earn time credits to spend on learning new skills.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Heart,
    title: "Spend on What You Love",
    description: "Use your time credits to learn anything you've always wanted - guitar, yoga, languages, and more!",
    gradient: "from-orange-500 to-red-500"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4">
            How TimeLink Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A simple three-step process to start exchanging skills and building your community
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white rounded-3xl"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl sm:text-2xl text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
