import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Camera } from "lucide-react";
import type { PageType } from "../App";

interface EditProfilePageProps {
  onNavigate?: (page: PageType) => void;
}

export function EditProfilePage({ onNavigate }: EditProfilePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-600">Update your personal information</p>
          </div>

          <Card className="p-8 rounded-2xl border-0 shadow-lg">
            <form className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbnxlbnwxfHx8fDE3NjAwOTMwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                  <button 
                    type="button"
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-3">Click the camera icon to update your photo</p>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name"
                  defaultValue="Alex Thompson"
                  className="mt-2"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email"
                  type="email"
                  defaultValue="alex.thompson@example.com"
                  className="mt-2"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  defaultValue="Passionate about teaching web development and learning new languages. Love connecting with people through skill exchange!"
                  className="mt-2 min-h-24"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  defaultValue="San Francisco, CA"
                  placeholder="City, Country"
                  className="mt-2"
                />
              </div>

              {/* Phone Number */}
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="mt-2"
                />
              </div>

              {/* Languages */}
              <div>
                <Label htmlFor="languages">Languages</Label>
                <Input 
                  id="languages"
                  defaultValue="English, Spanish"
                  placeholder="Separate with commas"
                  className="mt-2"
                />
              </div>

              {/* Website/Portfolio */}
              <div>
                <Label htmlFor="website">Website/Portfolio</Label>
                <Input 
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  className="mt-2"
                />
              </div>

              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input 
                    id="linkedin"
                    placeholder="linkedin.com/in/username"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input 
                    id="twitter"
                    placeholder="@username"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onNavigate?.("profile")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
