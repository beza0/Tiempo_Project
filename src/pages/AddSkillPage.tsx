import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";
import type { PageType } from "../App";

interface AddSkillPageProps {
  onNavigate?: (page: PageType) => void;
}

const categories = ["Sports", "Arts", "Languages", "Programming", "Music", "Cooking", "Photography", "Writing", "Design"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function AddSkillPage({ onNavigate }: AddSkillPageProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [locationType, setLocationType] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleLocationType = (type: string) => {
    setLocationType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl text-gray-900 mb-2">Add New Skill</h1>
            <p className="text-gray-600">Share your expertise with the TimeLink community</p>
          </div>

          <Card className="p-8 rounded-2xl border-0 shadow-lg">
            <form className="space-y-6">
              {/* Skill Title */}
              <div>
                <Label htmlFor="title">Skill Title *</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Beginner Guitar Lessons"
                  className="mt-2"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe what you'll teach, who it's for, and what students will learn..."
                  className="mt-2 min-h-32"
                />
              </div>

              {/* Expertise Level */}
              <div>
                <Label htmlFor="level">Your Expertise Level *</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Type */}
              <div>
                <Label>Session Type *</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="online"
                      checked={locationType.includes("online")}
                      onCheckedChange={() => toggleLocationType("online")}
                    />
                    <label htmlFor="online" className="text-sm cursor-pointer">Online</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="in-person"
                      checked={locationType.includes("in-person")}
                      onCheckedChange={() => toggleLocationType("in-person")}
                    />
                    <label htmlFor="in-person" className="text-sm cursor-pointer">In-Person</label>
                  </div>
                </div>
              </div>

              {/* Location (if in-person) */}
              {locationType.includes("in-person") && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location"
                    placeholder="e.g., Downtown Studio, Central Park"
                    className="mt-2"
                  />
                </div>
              )}

              {/* Time Credits per Hour */}
              <div>
                <Label htmlFor="credits">Time Credits per Hour *</Label>
                <Input 
                  id="credits"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g., 2"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Standard rate is 1 credit per hour</p>
              </div>

              {/* Session Duration */}
              <div>
                <Label htmlFor="duration">Session Duration (minutes) *</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Available Days */}
              <div>
                <Label>Available Days *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {days.map(day => (
                    <div key={day} className="flex items-center gap-2">
                      <Checkbox 
                        id={day}
                        checked={selectedDays.includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <label htmlFor={day} className="text-sm cursor-pointer">{day}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Available From *</Label>
                  <Input 
                    id="start-time"
                    type="time"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Available Until *</Label>
                  <Input 
                    id="end-time"
                    type="time"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags and press Enter"
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onNavigate?.("dashboard")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  Publish Skill
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
