import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import type { PageType } from "../App";

interface ProfilePageProps {
  onNavigate?: (page: PageType) => void;
}
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { 
  MapPin, 
  Calendar, 
  Star, 
  Award, 
  BookOpen, 
  Clock,
  Edit,
  Share2,
  MessageCircle
} from "lucide-react";

const skills = [
  { name: "Web Development", level: "Expert", students: 45, rating: 5.0 },
  { name: "Spanish", level: "Advanced", students: 28, rating: 4.9 },
  { name: "Photography", level: "Intermediate", students: 12, rating: 4.8 }
];

const learningSkills = [
  { name: "Yoga", instructor: "Sarah M.", progress: 75, sessions: 12 },
  { name: "Guitar", instructor: "Marcus J.", progress: 45, sessions: 8 },
  { name: "Digital Art", instructor: "Alex K.", progress: 60, sessions: 10 }
];

const reviews = [
  {
    student: "John Doe",
    avatar: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    skill: "Web Development",
    comment: "Amazing teacher! Very patient and explains concepts clearly.",
    date: "2 weeks ago"
  },
  {
    student: "Jane Smith",
    avatar: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    skill: "Spanish",
    comment: "Great conversationalist! Helped me improve my fluency significantly.",
    date: "1 month ago"
  }
];

const achievements = [
  { name: "Early Bird", description: "Completed 10 morning sessions", icon: "🌅" },
  { name: "Knowledge Sharer", description: "Taught 50+ hours", icon: "📚" },
  { name: "Quick Learner", description: "Completed 5 skills", icon: "⚡" },
  { name: "Community Star", description: "5.0 rating from 100+ reviews", icon: "⭐" }
];

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Alex Thompson"
              className="w-32 h-32 rounded-2xl object-cover shadow-2xl border-4 border-white"
            />
            
            <div className="flex-1 text-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-3xl mb-2">Alex Thompson</h1>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                    <span className="text-lg">4.9 (185 reviews)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={() => onNavigate?.("edit-profile")}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              
              <p className="text-white/90 mb-4 max-w-2xl">
                Passionate about teaching web development and learning new languages. 
                Love connecting with people through skill exchange!
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Member since Jan 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>124 hours exchanged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12">
        <Tabs defaultValue="teaching" className="space-y-6">
          <TabsList className="bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger value="teaching" className="rounded-lg">Teaching</TabsTrigger>
            <TabsTrigger value="learning" className="rounded-lg">Learning</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">Reviews</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-lg">Achievements</TabsTrigger>
          </TabsList>
          
          {/* Teaching Tab */}
          <TabsContent value="teaching" className="space-y-4">
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Skills I Teach</h2>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={() => onNavigate?.("add-skill")}
                >
                  Add New Skill
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill, index) => (
                  <Card key={index} className="p-5 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg text-gray-900">{skill.name}</h3>
                        <Badge variant="secondary" className="mt-1">{skill.level}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{skill.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{skill.students} students</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onNavigate?.("add-skill")}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onNavigate?.("skill-detail")}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
          
          {/* Learning Tab */}
          <TabsContent value="learning" className="space-y-4">
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <h2 className="text-xl text-gray-900 mb-6">Skills I'm Learning</h2>
              
              <div className="space-y-4">
                {learningSkills.map((skill, index) => (
                  <Card key={index} className="p-5 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg text-gray-900">{skill.name}</h3>
                        <p className="text-sm text-gray-600">with {skill.instructor}</p>
                      </div>
                      <Badge>{skill.sessions} sessions</Badge>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900">{skill.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${skill.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        Continue Learning
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
          
          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <h2 className="text-xl text-gray-900 mb-6">Student Reviews</h2>
              
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <Card key={index} className="p-5 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-4">
                      <ImageWithFallback 
                        src={review.avatar}
                        alt={review.student}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-gray-900">{review.student}</h4>
                            <p className="text-sm text-gray-600">{review.skill}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <h2 className="text-xl text-gray-900 mb-6">My Achievements</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <Card key={index} className="p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div>
                        <h4 className="text-gray-900 mb-1">{achievement.name}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}
