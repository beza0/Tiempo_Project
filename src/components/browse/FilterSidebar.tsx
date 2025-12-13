import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

const categories = [
  "Sports", "Arts", "Languages", "Programming", "Music", 
  "Cooking", "Photography", "Writing", "Design"
];

const locations = ["Online", "In-Person"];

interface Filters {
  categories: string[];
  locations: string[];
  minRating: number;
  timeCreditsRange: [number, number];
}

interface FilterSidebarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    onFiltersChange({ ...filters, locations: newLocations });
  };

  const setMinRating = (rating: number) => {
    onFiltersChange({ ...filters, minRating: rating });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      locations: [],
      minRating: 0,
      timeCreditsRange: [1, 20]
    });
  };

  return (
    <Card className="p-6 rounded-2xl border-0 shadow-lg sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg text-gray-900">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>
      </div>
      
      {/* Categories */}
      <div className="mb-6">
        <Label className="text-sm text-gray-900 mb-3 block">Categories</Label>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox 
                id={category} 
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <label 
                htmlFor={category} 
                className="text-sm text-gray-600 cursor-pointer"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Location */}
      <div className="mb-6">
        <Label className="text-sm text-gray-900 mb-3 block">Location</Label>
        <div className="space-y-3">
          {locations.map((location) => (
            <div key={location} className="flex items-center gap-2">
              <Checkbox 
                id={location}
                checked={filters.locations.includes(location)}
                onCheckedChange={() => toggleLocation(location)}
              />
              <label 
                htmlFor={location} 
                className="text-sm text-gray-600 cursor-pointer"
              >
                {location}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Time Credits Range */}
      <div className="mb-6">
        <Label className="text-sm text-gray-900 mb-3 block">
          Time Credits: {filters.timeCreditsRange[0]}-{filters.timeCreditsRange[1]} hours
        </Label>
        <Slider 
          value={filters.timeCreditsRange} 
          onValueChange={(value) => onFiltersChange({ ...filters, timeCreditsRange: value as [number, number] })}
          max={20} 
          step={1} 
          className="mb-2" 
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1h</span>
          <span>20h</span>
        </div>
      </div>
      
      {/* Rating */}
      <div className="mb-6">
        <Label className="text-sm text-gray-900 mb-3 block">Minimum Rating</Label>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox 
                id={`rating-${rating}`}
                checked={filters.minRating === rating}
                onCheckedChange={() => setMinRating(filters.minRating === rating ? 0 : rating)}
              />
              <label 
                htmlFor={`rating-${rating}`} 
                className="text-sm text-gray-600 cursor-pointer"
              >
                {rating}+ Stars
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
