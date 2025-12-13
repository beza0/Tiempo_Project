import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SkillCard } from "../components/browse/SkillCard";
import { FilterSidebar } from "../components/browse/FilterSidebar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import type { PageType } from "../App";

interface BrowsePageProps {
  onNavigate?: (page: PageType) => void;
}

const mockSkills = [
  {
    id: "1",
    title: "Beginner Yoga Classes",
    instructor: {
      name: "Sarah Martinez",
      image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.9,
      reviews: 127
    },
    category: "Sports",
    duration: "1 hour/session",
    location: "Online & In-Person",
    timeCredits: 2,
    image: "https://images.unsplash.com/photo-1758274535024-be3faa30f507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwaW5zdHJ1Y3RvciUyMHRlYWNoaW5nfGVufDF8fHx8MTc2MDEyMDA0N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Beginner", "Wellness", "Flexibility"]
  },
  {
    id: "2",
    title: "Guitar Lessons for All Levels",
    instructor: {
      name: "Marcus Johnson",
      image: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.8,
      reviews: 93
    },
    category: "Music",
    duration: "1.5 hours/session",
    location: "In-Person",
    timeCredits: 3,
    image: "https://images.unsplash.com/photo-1724161644178-95e09f524020?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndWl0YXIlMjB0ZWFjaGVyJTIwbXVzaWNpYW58ZW58MXx8fHwxNzYwMTkyODI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Music", "Acoustic", "Electric"]
  },
  {
    id: "3",
    title: "Web Development Fundamentals",
    instructor: {
      name: "Emily Chen",
      image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 5.0,
      reviews: 156
    },
    category: "Programming",
    duration: "2 hours/session",
    location: "Online",
    timeCredits: 4,
    image: "https://images.unsplash.com/photo-1565229284535-2cbbe3049123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxlc3NvbnxlbnwxfHx8fDE3NjAxOTI4MjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["HTML", "CSS", "JavaScript"]
  },
  {
    id: "4",
    title: "Spanish Conversation Practice",
    instructor: {
      name: "Carlos Rodriguez",
      image: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.7,
      reviews: 84
    },
    category: "Languages",
    duration: "1 hour/session",
    location: "Online",
    timeCredits: 2,
    image: "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjB0ZWFjaGluZyUyMGNsYXNzfGVufDF8fHx8MTc2MDE5MjgyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Intermediate", "Conversation", "Culture"]
  },
  {
    id: "5",
    title: "Digital Painting Basics",
    instructor: {
      name: "Alex Kim",
      image: "https://images.unsplash.com/photo-1655249481446-25d575f1c054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFufGVufDF8fHx8MTc2MDE2NzQxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.9,
      reviews: 112
    },
    category: "Arts",
    duration: "2 hours/session",
    location: "Online",
    timeCredits: 3,
    image: "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjB0ZWFjaGluZyUyMGNsYXNzfGVufDF8fHx8MTc2MDE5MjgyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Digital Art", "Procreate", "Photoshop"]
  },
  {
    id: "6",
    title: "Photography Composition",
    instructor: {
      name: "David Park",
      image: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.8,
      reviews: 98
    },
    category: "Arts",
    duration: "1.5 hours/session",
    location: "In-Person",
    timeCredits: 3,
    image: "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjB0ZWFjaGluZyUyMGNsYXNzfGVufDF8fHx8MTc2MDE5MjgyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    tags: ["Photography", "Composition", "Lighting"]
  }
];

export function BrowsePage({ onNavigate }: BrowsePageProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    locations: [],
    minRating: 0,
    timeCreditsRange: [1, 20]
  });

  // Filter skills based on search and filters
  const filteredSkills = useMemo(() => {
    return mockSkills.filter(skill => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          skill.title.toLowerCase().includes(query) ||
          skill.instructor.name.toLowerCase().includes(query) ||
          skill.category.toLowerCase().includes(query) ||
          skill.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(skill.category)) {
        return false;
      }

      // Location filter
      if (filters.locations.length > 0) {
        const skillLocation = skill.location.toLowerCase();
        const hasMatch = filters.locations.some(loc => {
          if (loc === "Online" && skillLocation.includes("online")) return true;
          if (loc === "In-Person" && !skillLocation.includes("online")) return true;
          return false;
        });
        if (!hasMatch) return false;
      }

      // Rating filter
      if (skill.instructor.rating < filters.minRating) {
        return false;
      }

      // Time credits filter
      if (skill.timeCredits < filters.timeCreditsRange[0] || skill.timeCredits > filters.timeCreditsRange[1]) {
        return false;
      }

      return true;
    });
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-white mb-4">
            Explore Skills
          </h1>
          <p className="text-lg text-white/90 mb-8">
            Find the perfect skill to learn from our community of experts
          </p>
          
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Search for skills, instructors, or categories..."
                className="pl-12 h-12 bg-white border-0 rounded-xl shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="md:hidden bg-white text-purple-600 hover:bg-gray-100 h-12 px-4"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onFiltersChange={setFilters} />
          </div>
          
          {/* Filters - Mobile */}
          {showMobileFilters && (
            <div className="lg:hidden col-span-1 mb-6">
              <FilterSidebar filters={filters} onFiltersChange={setFilters} />
            </div>
          )}
          
          {/* Skills Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredSkills.length} of {mockSkills.length} results
              </p>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
                <option>Most Relevant</option>
                <option>Highest Rated</option>
                <option>Lowest Time Credits</option>
                <option>Newest</option>
              </select>
            </div>
            
            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.id} {...skill} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-2">No skills found</p>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}
            
            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-12">
              <Button variant="outline" disabled>Previous</Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
