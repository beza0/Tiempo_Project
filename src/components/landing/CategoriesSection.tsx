import { Card } from "../ui/card";
import { Dumbbell, Palette, Languages, Code, Music } from "lucide-react";

const categories = [
  {
    icon: Dumbbell,
    name: "Sports",
    color: "from-green-400 to-emerald-600",
    bgColor: "bg-green-50",
    count: "150+ skills"
  },
  {
    icon: Palette,
    name: "Arts",
    color: "from-pink-400 to-rose-600",
    bgColor: "bg-pink-50",
    count: "200+ skills"
  },
  {
    icon: Languages,
    name: "Languages",
    color: "from-blue-400 to-indigo-600",
    bgColor: "bg-blue-50",
    count: "80+ languages"
  },
  {
    icon: Code,
    name: "Programming",
    color: "from-purple-400 to-violet-600",
    bgColor: "bg-purple-50",
    count: "120+ skills"
  },
  {
    icon: Music,
    name: "Music",
    color: "from-orange-400 to-amber-600",
    bgColor: "bg-orange-50",
    count: "90+ instruments"
  }
];

export function CategoriesSection() {
  return (
    <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4">
            Explore Categories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover endless possibilities to learn and teach across diverse skill categories
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index}
                className={`p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 rounded-2xl ${category.bgColor} group`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-lg text-gray-900 mb-1">
                  {category.name}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {category.count}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
