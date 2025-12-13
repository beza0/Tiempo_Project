import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalFooter 
} from "../ui/modal";
import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { useState } from "react";

interface UpcomingSessionProps {
  id: string;
  title: string;
  instructor: {
    name: string;
    image: string;
  };
  date: string;
  time: string;
  duration: string;
  location: string;
  type: "online" | "in-person";
}

export function UpcomingSession({ 
  title, 
  instructor, 
  date, 
  time, 
  duration, 
  location, 
  type 
}: UpcomingSessionProps) {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleJoinSession = () => {
    setJoinDialogOpen(false);
    // Handle join logic
    console.log("Joining session:", title);
  };

  const handleCancelSession = () => {
    setCancelDialogOpen(false);
    // Handle cancel logic
    console.log("Cancelling session:", title);
  };

  return (
    <Card className="p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <ImageWithFallback 
          src={instructor.image}
          alt={instructor.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-gray-900 mb-1">{title}</h4>
              <p className="text-sm text-gray-600">with {instructor.name}</p>
            </div>
            <Badge variant={type === "online" ? "default" : "secondary"}>
              {type === "online" ? "Online" : "In-Person"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{time} ({duration})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 col-span-2">
              {type === "online" ? (
                <Video className="w-3 h-3" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              <span>{location}</span>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              onClick={() => setJoinDialogOpen(true)}
            >
              Join Session
            </Button>
            
            <Modal open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Join Session</ModalTitle>
                  <ModalDescription>
                    You're about to join "{title}" with {instructor.name}.
                    <br /><br />
                    Session details:
                    <br />• Date: {date}
                    <br />• Time: {time}
                    <br />• Duration: {duration}
                    <br />• Location: {location}
                  </ModalDescription>
                </ModalHeader>
                <ModalFooter>
                  <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                    Not Yet
                  </Button>
                  <Button 
                    onClick={handleJoinSession}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  >
                    Join Now
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel
            </Button>
            
            <Modal open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <ModalContent>
                <ModalHeader>
                  <ModalTitle>Cancel Session?</ModalTitle>
                  <ModalDescription>
                    Are you sure you want to cancel this session? This action cannot be undone.
                    <br /><br />
                    Your time credits will be refunded, but {instructor.name} will be notified.
                  </ModalDescription>
                </ModalHeader>
                <ModalFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                    Keep Session
                  </Button>
                  <Button 
                    onClick={handleCancelSession}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Yes, Cancel Session
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </div>
        </div>
      </div>
    </Card>
  );
}
