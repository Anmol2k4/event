import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Plus, Users, AlertCircle } from "lucide-react";

const CreateEventForm = ({ onEventCreated }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    planner_name: "",
    contact_email: "",
    contact_phone: "",
    status: "pending",
    vendors_needed: []
  });

  const vendorTypes = [
    { id: "caterer", label: "Caterer", description: "Food and beverage services" },
    { id: "photographer", label: "Photographer", description: "Event photography and videography" },
    { id: "dj", label: "DJ/Music", description: "Music and sound systems" },
    { id: "decorator", label: "Decorator", description: "Venue decoration and setup" },
    { id: "event_planner", label: "Event Planner", description: "Professional event coordination" },
    { id: "vendor", label: "General Vendor", description: "Equipment and supplies" },
    { id: "volunteer", label: "Volunteers", description: "Event support and assistance" },
    { id: "sponsor", label: "Sponsors", description: "Financial or material sponsors" },
    { id: "other", label: "Other Services", description: "Additional specialized services" }
  ];

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

  useEffect(() => {
    // Check user permissions
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setCanCreateEvents(allowedRoles.includes(parsedUser.role));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.event_date || !formData.location || !formData.planner_name) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to create event');
        setLoading(false);
        return;
      }

      const createdEvent = await res.json();
      toast.success('Event created successfully!');
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        planner_name: "",
        contact_email: "",
        contact_phone: "",
        status: "pending",
        vendors_needed: []
      });

      // Notify parent component
      if (onEventCreated) {
        onEventCreated(createdEvent);
      }
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Show permission denied message if user cannot create events
  if (user && !canCreateEvents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Event Creation Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Access Denied:</strong> Only event organizers and planners can create events.</p>
                <p><strong>Your Role:</strong> {user?.role?.replace('_', ' ') || 'Unknown'}</p>
                <p><strong>Allowed Roles:</strong></p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Event Planner</li>
                  <li>Event Manager</li>
                  <li>Event Coordinator</li>
                  <li>Operations Manager</li>
                  <li>Production Manager</li>
                  <li>Venue Manager</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  If you need to create events, please contact an administrator to update your role.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Event
        </CardTitle>
        <CardDescription>
          Add a new event with complete contact information and specify required vendor services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the event details, requirements, and what attendees can expect"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="Enter event location/venue"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planner_name">Organizer Name *</Label>
              <Input
                id="planner_name"
                placeholder="Event organizer name"
                value={formData.planner_name}
                onChange={(e) => setFormData({ ...formData, planner_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="organizer@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="+91-XXXXXXXXXX"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-base font-medium">Vendor Requirements</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select the types of services you need for this event. This helps us connect you with the right service providers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorTypes.map((vendor) => (
                <div key={vendor.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`vendor-${vendor.id}`}
                    checked={formData.vendors_needed.includes(vendor.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          vendors_needed: [...formData.vendors_needed, vendor.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          vendors_needed: formData.vendors_needed.filter(v => v !== vendor.id)
                        });
                      }
                    }}
                    disabled={loading}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`vendor-${vendor.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {vendor.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {vendor.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {formData.vendors_needed.length > 0 && (
              <div className="text-sm text-primary">
                ✓ Selected {formData.vendors_needed.length} vendor type{formData.vendors_needed.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventForm;