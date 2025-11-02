import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, FileText, User, Star, Users, Briefcase } from "lucide-react";
import { format } from "date-fns";
import ReviewModal from "./ReviewModal";
import ShareEvent from "./ShareEvent";

interface EventCardProps {
  event: {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    event_date: string;
    location: string;
    planner_name: string;
    contact_email?: string;
    contact_phone?: string;
    vendors_needed?: string[];
    status: string;
    // Legacy fields for backward compatibility
    event_type?: string;
    event_name?: string;
    requirements?: string;
    created_by?: string;
    profiles?: {
      name: string;
      role: string;
      email?: string;
      phone?: string;
    };
  };
  onShowInterest?: (eventId: string) => void;
  onContact?: (eventId: string) => void;
  showActions?: boolean;
  showReviewButton?: boolean;
  onReviewSubmitted?: () => void;
  showShareButton?: boolean;
  userRole?: string; // Add user role to determine what actions to show
}

const EventCard = ({ event, onShowInterest, onContact, showActions = true, showReviewButton = false, onReviewSubmitted, showShareButton = true, userRole }: EventCardProps) => {
  // Check if event is in the past (can be reviewed)
  const eventDate = new Date(event.event_date);
  const currentDate = new Date();
  const isPastEvent = eventDate < currentDate;

  // Get event ID (handle both legacy and new formats)
  const eventId = event._id || event.id;
  
  // Get event title (handle both legacy and new formats)
  const eventTitle = event.title || event.event_name;
  
  // Get event description (handle both legacy and new formats)
  const eventDescription = event.description || event.requirements;

  // Vendor type labels for display
  const vendorLabels = {
    caterer: "Caterer",
    photographer: "Photographer",
    dj: "DJ/Music",
    decorator: "Decorator", 
    event_planner: "Event Planner",
    vendor: "Vendor",
    volunteer: "Volunteers",
    sponsor: "Sponsors",
    other: "Other Services"
  };

  // Define roles that can see contact information
  const canSeeContactInfo = userRole && [
    'Event Planner',
    'Event Manager',
    'Event Coordinator',
    'Operations Manager',
    'Production Manager',
    'Venue Manager',
    'Technical Manager',
    'Creative Director',
    'Artist Manager',
    'Media Agency',
    'Manpower Manager',
    'Anchor/Host',
    'admin'
  ].includes(userRole);

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 border-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-primary mb-2">
              {eventTitle}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-foreground/70 flex-wrap">
              {event.event_type && (
                <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                  {event.event_type}
                </Badge>
              )}
              {event.status && (
                <Badge 
                  variant={event.status === "approved" ? "default" : "outline"}
                  className={
                    event.status === "approved" 
                      ? "bg-success/20 text-success-foreground border-success/30" 
                      : event.status === "pending"
                      ? "bg-accent/20 text-accent-foreground border-accent/30"
                      : "bg-destructive/20 text-destructive-foreground border-destructive/30"
                  }
                >
                  {event.status}
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{format(new Date(event.event_date), "PPP")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-secondary" />
          <span>{event.location}</span>
        </div>
        
        {/* Organizer Information */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 text-accent" />
          <span>
            {event.planner_name || (event.profiles && `${event.profiles.name} (${event.profiles.role.replace("_", " ")})`)}
          </span>
        </div>

        {/* Vendor Requirements Section */}
        {event.vendors_needed && event.vendors_needed.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <Briefcase className="h-4 w-4" />
              <span>Services Needed</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {event.vendors_needed.slice(0, 4).map((vendor) => (
                <Badge 
                  key={vendor}
                  variant="outline" 
                  className="text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                >
                  {vendorLabels[vendor] || vendor}
                </Badge>
              ))}
              {event.vendors_needed.length > 4 && (
                <Badge variant="outline" className="text-xs bg-muted/50 border-muted text-muted-foreground">
                  +{event.vendors_needed.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Event Description */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground line-clamp-3">{eventDescription}</p>
          </div>
        </div>
      </CardContent>
      {(showActions || showReviewButton || showShareButton) && (
        <CardFooter className="flex gap-2 flex-wrap">
          {showActions && (
            <>
              <Button 
                onClick={() => onShowInterest?.(eventId)}
                className="flex-1 bg-primary hover:bg-primary-dark transition-smooth"
              >
                Show Interest
              </Button>
              {canSeeContactInfo && (
                <Button 
                  onClick={() => onContact?.(eventId)}
                  variant="outline"
                  className="flex-1 border-secondary text-secondary hover:bg-secondary/10 transition-smooth"
                >
                  Contact Planner
                </Button>
              )}
            </>
          )}
          <div className="flex gap-2 w-full justify-end">
            {showReviewButton && isPastEvent && (
              <ReviewModal
                eventId={eventId}
                eventTitle={eventTitle}
                onReviewSubmitted={onReviewSubmitted}
              />
            )}
            {showShareButton && (
              <ShareEvent
                event={{
                  id: eventId,
                  event_name: eventTitle,
                  event_date: event.event_date,
                  location: event.location,
                  requirements: eventDescription,
                }}
              />
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default EventCard;
