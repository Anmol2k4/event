import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  DollarSign, 
  Users, 
  Eye, 
  Mail, 
  Phone, 
  TrendingUp, 
  Calendar,
  MapPin,
  User,
  MessageCircle,
  Loader2,
  Briefcase,
  BarChart3
} from "lucide-react";

interface Event {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  planner_name: string;
  contact_email: string;
  contact_phone: string;
  vendors_needed?: string[];
  status: string;
  interested_count?: number;
  potential_revenue?: number;
  vendor_interest?: { [key: string]: number };
}

interface InterestedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface VendorAnalytics {
  vendorType: string;
  demandCount: number;  // Number of events needing this vendor
  interestCount: number; // Number of interested users matching this vendor
  potentialMatches: number; // Potential vendor-event matches
}

const BusinessManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [interestedLoading, setInterestedLoading] = useState(false);
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([]);
  
  // Contact organizer dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast.error('Please login to access admin panel');
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchBusinessData();
  }, [navigate]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // Fetch all approved events
      const eventsRes = await fetch('/api/events');
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      
      const eventsData = await eventsRes.json();
      
      // For each event, fetch interested users count
      const eventsWithInterest = await Promise.all(
        eventsData.map(async (event: Event) => {
          try {
            const token = localStorage.getItem('token');
            const interestRes = await fetch(`/api/interests/event/${event._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (interestRes.ok) {
              const interestData = await interestRes.json();
              const interestedCount = interestData.length;
              
              return {
                ...event,
                interested_count: interestedCount,
                potential_revenue: interestedCount * 50, // ₹50 per connection (example rate)
              };
            }
            
            return { ...event, interested_count: 0, potential_revenue: 0 };
          } catch (error) {
            return { ...event, interested_count: 0, potential_revenue: 0 };
          }
        })
      );
      
      // Sort by potential revenue (highest first)
      eventsWithInterest.sort((a, b) => (b.potential_revenue || 0) - (a.potential_revenue || 0));
      setEvents(eventsWithInterest);
      
      // Calculate vendor analytics
      calculateVendorAnalytics(eventsWithInterest);
      
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestedUsers = async (eventId: string) => {
    setInterestedLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/interests/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch interested users');
      
      const data = await res.json();
      setInterestedUsers(data);
    } catch (error) {
      console.error('Error fetching interested users:', error);
      toast.error('Failed to fetch interested users');
      setInterestedUsers([]);
    } finally {
      setInterestedLoading(false);
    }
  };

  const calculateVendorAnalytics = (eventsData: Event[]) => {
    const vendorLabels = {
      caterer: "Caterer",
      photographer: "Photographer",
      dj: "DJ/Music",
      decorator: "Decorator",
      event_planner: "Event Planner",
      vendor: "General Vendor",
      volunteer: "Volunteers",
      sponsor: "Sponsors",
      other: "Other Services"
    };

    const analytics: VendorAnalytics[] = [];
    
    Object.keys(vendorLabels).forEach(vendorType => {
      // Count events needing this vendor type
      const demandCount = eventsData.filter(event => 
        event.vendors_needed && event.vendors_needed.includes(vendorType)
      ).length;
      
      // Calculate total interested users for events needing this vendor
      const interestCount = eventsData.reduce((total, event) => {
        if (event.vendors_needed && event.vendors_needed.includes(vendorType)) {
          return total + (event.interested_count || 0);
        }
        return total;
      }, 0);
      
      // Potential matches (events with vendor needs × interested users)
      const potentialMatches = eventsData.reduce((total, event) => {
        if (event.vendors_needed && event.vendors_needed.includes(vendorType)) {
          // Assume 20% of interested users might be relevant vendors
          return total + Math.floor((event.interested_count || 0) * 0.2);
        }
        return total;
      }, 0);
      
      if (demandCount > 0 || interestCount > 0) {
        analytics.push({
          vendorType: vendorLabels[vendorType],
          demandCount,
          interestCount,
          potentialMatches
        });
      }
    });
    
    // Sort by potential revenue (demand × interest)
    analytics.sort((a, b) => (b.demandCount * b.interestCount) - (a.demandCount * a.interestCount));
    setVendorAnalytics(analytics);
  };

  const handleViewInterested = async (event: Event) => {
    setSelectedEvent(event);
    await fetchInterestedUsers(event._id);
  };

  const handleContactOrganizer = (event: Event) => {
    setSelectedEvent(event);
    
    // Build vendor-specific message if vendors are specified
    let vendorMessage = "";
    if (event.vendors_needed && event.vendors_needed.length > 0) {
      const vendorLabels = {
        caterer: "Caterer", photographer: "Photographer", dj: "DJ/Music",
        decorator: "Decorator", event_planner: "Event Planner", vendor: "General Vendor",
        volunteer: "Volunteers", sponsor: "Sponsors", other: "Other Services"
      };
      
      const neededServices = event.vendors_needed.map(v => vendorLabels[v] || v).join(", ");
      vendorMessage = `\n\nI notice you've specified vendor requirements for: ${neededServices}. We can also help connect you with relevant service providers in our network who might be interested in collaborating with your event.`;
    }
    
    setContactMessage(
      `Hello ${event.planner_name},\n\nI hope this message finds you well. I'm reaching out from the Event Network platform regarding your event "${event.title}".\n\nGreat news! Your event has generated significant interest among our user base. We currently have ${event.interested_count} users who have expressed interest in attending your event.${vendorMessage}\n\nWe offer a service to connect you directly with these interested attendees. Our rate is ₹${proposedRate || '50'} per connection, which would total ₹${event.potential_revenue || (event.interested_count || 0) * 50} for all interested users.\n\nThis service includes:\n- Direct contact information of interested attendees\n- User profiles and preferences\n- Follow-up support for event management${event.vendors_needed && event.vendors_needed.length > 0 ? '\n- Vendor network connections and recommendations' : ''}\n\nWould you be interested in learning more about this opportunity?\n\nBest regards,\nEvent Network Admin Team`
    );
    setProposedRate("50");
    setContactDialogOpen(true);
  };

  const sendMessageToOrganizer = async () => {
    if (!selectedEvent || !contactMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      // Here you would typically integrate with an email service
      // For now, we'll just simulate the action and store it locally
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Business proposal sent to ${selectedEvent.planner_name}!`);
      
      // Close dialog and reset
      setContactDialogOpen(false);
      setContactMessage("");
      setProposedRate("");
      
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Calculate total business metrics
  const totalInterested = events.reduce((sum, event) => sum + (event.interested_count || 0), 0);
  const totalPotentialRevenue = events.reduce((sum, event) => sum + (event.potential_revenue || 0), 0);
  const highValueEvents = events.filter(event => (event.interested_count || 0) >= 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Management</h1>
          <p className="text-gray-600">Monetize event connections and manage revenue opportunities</p>
        </div>

        {/* Business Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Interested Users</p>
                  <p className="text-2xl font-bold">{totalInterested}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potential Revenue</p>
                  <p className="text-2xl font-bold">₹{totalPotentialRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High-Value Events</p>
                  <p className="text-2xl font-bold">{highValueEvents.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Revenue Opportunities</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
            <TabsTrigger value="analytics">Business Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Opportunities by Event
                </CardTitle>
                <CardDescription>
                  Events sorted by potential revenue. Contact organizers to monetize connections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No events found</p>
                  ) : (
                    events.map((event) => (
                      <div key={event._id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {event.event_date}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {event.planner_name}
                              </div>
                            </div>
                            
                            {/* Vendor Requirements */}
                            {event.vendors_needed && event.vendors_needed.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2 text-sm mb-2">
                                  <Briefcase className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-primary">Vendor Services Needed:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {event.vendors_needed.slice(0, 3).map((vendor) => {
                                    const vendorLabels = {
                                      caterer: "Caterer", photographer: "Photographer", dj: "DJ/Music",
                                      decorator: "Decorator", event_planner: "Event Planner", vendor: "Vendor",
                                      volunteer: "Volunteers", sponsor: "Sponsors", other: "Other Services"
                                    };
                                    return (
                                      <Badge 
                                        key={vendor}
                                        variant="outline" 
                                        className="text-xs bg-primary/5 border-primary/30 text-primary"
                                      >
                                        {vendorLabels[vendor] || vendor}
                                      </Badge>
                                    );
                                  })}
                                  {event.vendors_needed.length > 3 && (
                                    <Badge variant="outline" className="text-xs bg-muted/50">
                                      +{event.vendors_needed.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right space-y-2">
                            <Badge variant={(event.interested_count || 0) >= 10 ? "default" : (event.interested_count || 0) >= 5 ? "secondary" : "outline"}>
                              {event.interested_count} Interested
                            </Badge>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Potential: </span>
                              <span className="font-semibold text-green-600">₹{event.potential_revenue}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleViewInterested(event)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Interested Users ({event.interested_count})
                          </Button>
                          
                          {(event.interested_count || 0) > 0 && (
                            <Button
                              onClick={() => handleContactOrganizer(event)}
                              variant="default"
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Contact Organizer (₹{event.potential_revenue})
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Vendor Market Analytics
                </CardTitle>
                <CardDescription>
                  Analyze demand and opportunities for different vendor services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {vendorAnalytics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vendorAnalytics.map((vendor) => (
                        <Card key={vendor.vendorType} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg">{vendor.vendorType}</h4>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Events Needing:</span>
                                  <Badge variant="secondary">{vendor.demandCount}</Badge>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Total Interest:</span>
                                  <Badge variant="outline">{vendor.interestCount} users</Badge>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Potential Matches:</span>
                                  <Badge 
                                    variant={vendor.potentialMatches > 0 ? "default" : "secondary"}
                                    className={vendor.potentialMatches > 0 ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {vendor.potentialMatches}
                                  </Badge>
                                </div>
                                
                                {vendor.potentialMatches > 0 && (
                                  <div className="mt-3 pt-2 border-t">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                      <span>Potential Revenue:</span>
                                      <span className="text-green-600">
                                        ₹{(vendor.potentialMatches * 50).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {vendor.demandCount > 0 && vendor.interestCount > 0 && (
                                <div className="mt-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ 
                                        width: `${Math.min((vendor.potentialMatches / vendor.interestCount) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Match Rate: {Math.round((vendor.potentialMatches / Math.max(vendor.interestCount, 1)) * 100)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No vendor analytics available yet.</p>
                      <p className="text-sm">Analytics will appear when events specify vendor requirements.</p>
                    </div>
                  )}

                  {/* Vendor Insights Summary */}
                  {vendorAnalytics.length > 0 && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <CardContent className="p-6">
                        <h4 className="flex items-center gap-2 font-semibold text-lg mb-4">
                          <BarChart3 className="h-5 w-5" />
                          Vendor Market Insights
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground mb-2">Top Demand Vendors</h5>
                            {vendorAnalytics
                              .sort((a, b) => b.demandCount - a.demandCount)
                              .slice(0, 3)
                              .map((vendor, index) => (
                                <div key={vendor.vendorType} className="flex items-center gap-2 text-sm py-1">
                                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{vendor.vendorType}</span>
                                  <Badge variant="secondary" className="ml-auto">
                                    {vendor.demandCount} events
                                  </Badge>
                                </div>
                              ))}
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm text-muted-foreground mb-2">Best Revenue Opportunities</h5>
                            {vendorAnalytics
                              .sort((a, b) => (b.potentialMatches * 50) - (a.potentialMatches * 50))
                              .slice(0, 3)
                              .map((vendor, index) => (
                                <div key={vendor.vendorType} className="flex items-center gap-2 text-sm py-1">
                                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                  </span>
                                  <span>{vendor.vendorType}</span>
                                  <Badge variant="secondary" className="ml-auto text-green-600">
                                    ₹{(vendor.potentialMatches * 50).toLocaleString()}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics</CardTitle>
                <CardDescription>Revenue insights and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Revenue Distribution</h4>
                    <div className="space-y-2">
                      {events.slice(0, 5).map((event, index) => (
                        <div key={event._id} className="flex items-center justify-between py-2 border-b">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-green-600 font-semibold">₹{event.potential_revenue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Interested Users Dialog */}
        <Dialog open={!!selectedEvent && !contactDialogOpen} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Interested Users - {selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {interestedLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {interestedUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No interested users found</p>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-semibold">
                          Revenue Opportunity: ₹{selectedEvent?.potential_revenue} 
                          ({interestedUsers.length} connections × ₹50 each)
                        </span>
                      </div>
                    </div>
                    
                    {interestedUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Organizer Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Contact Event Organizer</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900">{selectedEvent.title}</h4>
                  <p className="text-sm text-blue-800">
                    Organizer: {selectedEvent.planner_name}
                  </p>
                  <p className="text-sm text-blue-800">
                    {selectedEvent.interested_count} interested users • ₹{selectedEvent.potential_revenue} potential revenue
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Proposed Rate per Connection (₹)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={proposedRate}
                    onChange={(e) => {
                      setProposedRate(e.target.value);
                      // Update the message when rate changes
                      const newRate = e.target.value;
                      const totalRevenue = (selectedEvent.interested_count || 0) * parseInt(newRate || "0");
                      setContactMessage(prev => 
                        prev.replace(/₹\d+/g, `₹${newRate}`).replace(/₹\d+/g, `₹${totalRevenue}`)
                      );
                    }}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message to Organizer</Label>
                  <Textarea
                    id="message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={12}
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setContactDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={sendingMessage}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendMessageToOrganizer}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Business Proposal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessManagement;