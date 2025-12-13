import { Card } from "../ui/card";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Martinez",
    role: "Yoga Instructor & Guitar Student",
    image: "https://images.unsplash.com/photo-1745434159123-af6142c7862f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwd29tYW4lMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzYwMTQ4MzIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "I taught guitar lessons and learned yoga! TimeLink connected me with amazing people and I've gained skills I never thought I could afford to learn."
  },
  {
    name: "Marcus Johnson",
    role: "Web Developer & Spanish Student",
    image: "https://images.unsplash.com/photo-1746813629105-3c4a26b09936?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWlsaW5nJTIwbWFuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2MDE2OTMyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "Teaching coding in exchange for Spanish lessons has been incredible. I'm now conversational in Spanish and made great friends in the process!"
  },
  {
    name: "Emily Chen",
    role: "Piano Teacher & Fitness Enthusiast",
    image: "https://images.unsplash.com/photo-1656582117510-3a177bf866c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHBlcnNvbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MDE3NDIwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    quote: "TimeLink changed my life! I share my piano skills and get personal training sessions. It's the perfect community for lifelong learners like me."
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4">
            What Our Members Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of happy learners and teachers building connections through skill exchange
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white rounded-3xl"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 italic">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-4">
                <ImageWithFallback 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
