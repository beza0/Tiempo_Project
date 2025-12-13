import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import type { PageType } from "../App";

interface DashboardPageProps {
  onNavigate?: (page: PageType) => void;
}
import { StatCard } from "../components/dashboard/StatCard";
import { UpcomingSession } from "../components/dashboard/UpcomingSession";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Clock, TrendingUp, BookOpen, Award, Plus } from "lucide-react";

const stats = [
  {
    title: "Time Credits",
    value: "24h",
    icon: Clock,
    gradient: "from-blue-500 to-cyan-500",
    description: "+6h this month"
  },
  {
    title: "Skills Learning",
    value: "5",
    icon: BookOpen,
    gradient: "from-purple-500 to-pink-500",
    description: "3 active sessions"
  },
  {
    title: "Skills Teaching",
    value: "3",
    icon: TrendingUp,
    gradient: "from-orange-500 to-red-500",
    description: "12 students"
  },
  {
    title: "Achievements",
    value: "8",
    icon: Award,
    gradient: "from-green-500 to-emerald-500",
    description: "2 new badges"
  }
];

const upcomingSessions = [
  {
    id: "1",
    title: "Yoga for Beginners",
    instructor: {
      name: "Sarah Martinez",
      image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    date: "Oct 12, 2025",
    time: "10:00 AM",
    duration: "1h",
    location: "Zoom Meeting",
    type: "online" as const
  },
  {
    id: "2",
    title: "Guitar Advanced Techniques",
    instructor: {
      name: "Marcus Johnson",
      image: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    date: "Oct 13, 2025",
    time: "2:00 PM",
    duration: "1.5h",
    location: "Music Studio, Downtown",
    type: "in-person" as const
  },
  {
    id: "3",
    title: "Web Development Q&A",
    instructor: {
      name: "Emily Chen",
      image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    date: "Oct 14, 2025",
    time: "6:00 PM",
    duration: "2h",
    location: "Google Meet",
    type: "online" as const
  }
];

const learningProgress = [
  { skill: "Spanish Conversation", progress: 75, instructor: "Carlos R." },
  { skill: "Digital Painting", progress: 45, instructor: "Alex K." },
  { skill: "Photography Basics", progress: 60, instructor: "David P." }
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl text-white mb-2">
            Welcome back, Alex! 👋
          </h1>
          <p className="text-lg text-white/90">
            Here's what's happening with your learning journey
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-gray-900">Upcoming Sessions</h2>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={() => onNavigate?.("browse")}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Book New
                </Button>
              </div>
              
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <UpcomingSession key={session.id} {...session} />
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => onNavigate?.("past-sessions")}
              >
                View All Sessions
              </Button>
            </Card>
          </div>
          
          {/* Quick Actions & Progress */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <h3 className="text-lg text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={() => onNavigate?.("add-skill")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Offer a New Skill
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate?.("browse")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Skills
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate?.("past-sessions")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  View Past Sessions
                </Button>
              </div>
            </Card>
            
            {/* Learning Progress */}
            <Card className="p-6 rounded-2xl border-0 shadow-lg">
              <h3 className="text-lg text-gray-900 mb-4">Learning Progress</h3>
              <div className="space-y-4">
                {learningProgress.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-900">{item.skill}</p>
                        <p className="text-xs text-gray-500">{item.instructor}</p>
                      </div>
                      <span className="text-sm text-gray-600">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
