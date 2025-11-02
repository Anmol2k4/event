import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Shield, Loader2, User, Mail, Phone, Settings, DollarSign, Plus, Calendar, MapPin, Briefcase } from "lucide-react";
import EventCard from "@/components/EventCard";
import ReviewsDisplay from "@/components/ReviewsDisplay";
import PhotoGallery from "@/components/PhotoGallery";
import PhotoUpload from "@/components/PhotoUpload";
import EnhancedUserProfileModal from "@/components/EnhancedUserProfileModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Contact organizer modal state
  const [contactOpen, setContactOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  
  // Interest modal state  
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestUsers, setInterestUsers] = useState([]);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestEventName, setInterestEventName] = useState("");
  
  // Social features state
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Define roles that can create events
  const allowedRoles = [
    'event_planner',
    'event_manager', 
    'event_coordinator',
    'operations_manager',
    'production_manager',
    'venue_manager',
    'admin'
  ];

  const canCreateEvents = user && allowedRoles.includes(user.role);

  useEffect(() => {
    const initialize = async () => {
      console.log('Dashboard: Initializing...');
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Dashboard: Token exists:', !!token);
      console.log('Dashboard: User data exists:', !!userData);
      
      if (!token || !userData) {
        console.log('Dashboard: No auth data, redirecting to login');
        navigate('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        console.log('Dashboard: Parsed user:', parsedUser);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === 'admin');
        
        await fetchEvents();
        setLoading(false);
        console.log('Dashboard: Initialization complete');
      } catch (error) {
        console.error('Dashboard: Error during initialization:', error);
        navigate('/login');
      }
    };

    initialize();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      console.log('Dashboard: Fetching events from /api/events');
      const res = await fetch('/api/events');
      console.log('Dashboard: Events response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Dashboard: Events data:', data);
      
      // Log interested users data for each event
      if (Array.isArray(data)) {
        data.forEach((event, index) => {
          console.log(`Event ${index + 1} (${event.title}):`, {
            id: event._id,
            interestedUsers: event.interestedUsers,
            interestedCount: event.interestedUsers?.length || 0
          });
        });
      }
      
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Dashboard: Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleShowInterest = async (eventId) => {
    if (!user) {
      toast.error('Please login to show interest');
      return;
    }

    console.log('Showing interest for event:', eventId, 'by user:', user.id);

    try {
      const res = await fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          event_id: eventId,
        }),
      });

      console.log('Show interest response status:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('Show interest error:', error);
        toast.error(error.error || 'Failed to show interest');
        return;
      }

      const result = await res.json();
      console.log('Interest registered successfully:', result);
      toast.success('Interest registered successfully!');
      // Refresh events to update interested users count
      await fetchEvents();
    } catch (error) {
      console.error('Error showing interest:', error);
      toast.error('Failed to show interest');
    }
  };

  const handleContactOrganizer = async (eventId) => {
    // Check if user has permission to view contact information
    const authorizedRoles = [
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
    ];

    if (!user?.role || !authorizedRoles.includes(user.role)) {
      toast.error('You do not have permission to view contact information');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        toast.error('Failed to get event details');
        return;
      }
      
      const event = await res.json();
      
      const contactData = {
        name: event.planner_name || 'Event Organizer',
        email: event.contact_email || 'Not provided',
        phone: event.contact_phone || 'Not provided',
      };
      
      setContactInfo(contactData);
      setContactOpen(true);
    } catch (error) {
      console.error('Error fetching organizer details:', error);
      toast.error('Failed to get organizer details');
    }
  };

  const handleShowInterestUsers = async (event) => {
    setInterestLoading(true);
    setInterestEventName(event.title);
    setInterestOpen(true);
    
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('=== DEBUGGING INTERESTED USERS REQUEST ===');
      console.log('Event:', { id: event._id, title: event.title, user_id: event.user_id });
      console.log('Current user data:', JSON.parse(userData || '{}'));
      console.log('Token present:', !!token);
      
      const res = await fetch(`/api/interests/event/${event._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Interested users response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch interested users:', errorText);
        console.error('Response status:', res.status);
        console.error('Response headers:', res.headers);
        
        // Try to parse error as JSON for more details
        try {
          const errorData = JSON.parse(errorText);
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Raw error text:', errorText);
        }
        
        throw new Error(`Failed to fetch interested users: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Interested users data:', data);
      setInterestUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching interested users:', error);
      toast.error('Failed to fetch interested users');
      setInterestUsers([]);
    } finally {
      setInterestLoading(false);
    }
  };

  const handleViewSocialFeatures = (event) => {
    setSelectedEventId(event._id);
    setSelectedEvent(event);
    setSocialModalOpen(true);
  };

  const handleRefreshSocialFeatures = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewProfile = (user) => {
    setSelectedUserProfile(user);
    setProfileModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Welcome, {user?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Discover and connect with local events</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/profile")}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              {canCreateEvents && (
                <Button
                  onClick={() => navigate("/create-event")}
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button
                    onClick={() => navigate("/admin")}
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                  <Button
                    onClick={() => navigate("/admin/business")}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Business
                  </Button>
                  <Button
                    onClick={() => navigate("/admin/management")}
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Management
                  </Button>
                </>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="relative">
                <EventCard
                  event={{
                    _id: event._id,
                    id: event._id,
                    title: event.title,
                    description: event.description,
                    event_date: event.event_date,
                    location: event.location,
                    planner_name: event.planner_name,
                    status: event.status,
                    vendors_needed: event.vendors_needed,
                    // Legacy fields for backward compatibility
                    event_type: "Event",
                    event_name: event.title,
                    requirements: event.description,
                    created_by: event.planner_name,
                  }}
                  onShowInterest={handleShowInterest}
                  onContact={handleContactOrganizer}
                  showActions={true}
                  showReviewButton={true}
                  showShareButton={true}
                  onReviewSubmitted={handleRefreshSocialFeatures}
                  userRole={user?.role}
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => handleViewSocialFeatures(event)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <PhotoUpload
                    eventId={event._id}
                    eventTitle={event.title}
                    onPhotosUploaded={handleRefreshSocialFeatures}
                    currentUserId={user?.id}
                    eventOwnerId={event.user_id}
                    isEventOwner={user?.role === 'admin' || user?.id === event.user_id}
                  />
                </div>
                {user?.role === 'admin' && (
                  <Button
                    onClick={() => handleShowInterestUsers(event)}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    View Interested Users ({event.interestedUsers?.length || 0})
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Contact Organizer</DialogTitle>
          </DialogHeader>
          {contactInfo && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{contactInfo.name}</p>
                  <p className="text-sm text-muted-foreground">Event Organizer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className={`text-sm ${contactInfo.email === 'Not provided' ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {contactInfo.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className={`text-sm ${contactInfo.phone === 'Not provided' ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {contactInfo.phone}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={interestOpen} onOpenChange={setInterestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Interested Users - {interestEventName}</DialogTitle>
          </DialogHeader>
          {interestLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : interestUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No users have shown interest yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {interestUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <User className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                      {user.company && user.position && (
                        <p className="text-xs text-muted-foreground">
                          {user.position} at {user.company}
                        </p>
                      )}
                      {user.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProfile(user)}
                    className="gap-1"
                  >
                    <User className="h-4 w-4" />
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Social Features Modal */}
      <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details & Social Features</DialogTitle>
          </DialogHeader>
          {selectedEventId && selectedEvent && (
            <div className="space-y-6">
              {/* Event Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">{selectedEvent.title}</h3>
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Date:</span>
                      <span>{new Date(selectedEvent.event_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">Location:</span>
                      <span>{selectedEvent.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">Organizer:</span>
                      <span>{selectedEvent.planner_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Status: {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Vendor Requirements */}
                  {selectedEvent.vendors_needed && selectedEvent.vendors_needed.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                        <Briefcase className="h-4 w-4" />
                        <span>Services Needed</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.vendors_needed.map((vendor) => (
                          <Badge 
                            key={vendor}
                            variant="outline" 
                            className="bg-primary/5 border-primary/20 text-primary"
                          >
                            {vendor === 'caterer' ? 'Caterer' :
                             vendor === 'photographer' ? 'Photographer' :
                             vendor === 'dj' ? 'DJ/Music' :
                             vendor === 'decorator' ? 'Decorator' :
                             vendor === 'event_planner' ? 'Event Planner' :
                             vendor === 'vendor' ? 'General Vendor' :
                             vendor === 'volunteer' ? 'Volunteers' :
                             vendor === 'sponsor' ? 'Sponsors' :
                             vendor === 'other' ? 'Other Services' :
                             vendor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <ReviewsDisplay 
                eventId={selectedEventId} 
                refreshTrigger={refreshTrigger}
              />
              <PhotoGallery 
                eventId={selectedEventId} 
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced User Profile Modal */}
      <EnhancedUserProfileModal
        user={selectedUserProfile}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedUserProfile(null);
        }}
      />
    </div>
  );
};

export default Dashboard;