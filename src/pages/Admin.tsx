import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Shield, Trash2 } from "lucide-react";
import EventCard from "@/components/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<any[]>([]);
  const [rejectedEvents, setRejectedEvents] = useState<any[]>([]);

  useEffect(() => {
    // Check for JWT and admin role
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    if (parsedUser.role !== 'admin') {
      toast.error('Access denied: Admin privileges required');
      navigate('/dashboard');
      return;
    }
    fetchAllEvents(token);
    setLoading(false);
    // eslint-disable-next-line
  }, [navigate]);

  const fetchAllEvents = async (token: string) => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch('/api/events/status/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/events/status/approved', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/events/status/rejected', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const pending = await pendingRes.json();
      const approved = await approvedRes.json();
      const rejected = await rejectedRes.json();
      
      // Map MongoDB _id to id and transform data structure
      const mapEvents = (events: any[]) => {
        return Array.isArray(events) ? events.map(event => ({
          id: event._id,
          event_type: "Event",
          event_name: event.title,
          event_date: event.event_date,
          location: event.location,
          requirements: event.description,
          status: event.status,
          created_by: event.planner_name || 'Event Organizer',
          ...event // Keep original properties for backend operations
        })) : [];
      };
      
      setPendingEvents(mapEvents(pending));
      setApprovedEvents(mapEvents(approved));
      setRejectedEvents(mapEvents(rejected));
    } catch (err) {
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setActionLoading(eventId);
      console.log('Approving event with ID:', eventId);
      const res = await fetch(`/api/events/${eventId}/approve`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Approve failed:', res.status, errorText);
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success('Event approved!');
      await fetchAllEvents(token);
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setActionLoading(eventId);
      console.log('Rejecting event with ID:', eventId);
      const res = await fetch(`/api/events/${eventId}/reject`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Reject failed:', res.status, errorText);
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success('Event rejected!');
      await fetchAllEvents(token);
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Failed to reject event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone and will remove all associated data.`
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setActionLoading(eventId);
      console.log('Deleting event with ID:', eventId);
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete failed:', res.status, errorText);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      toast.success(data.message || 'Event deleted successfully!');
      await fetchAllEvents(token);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Admin Panel</h3>
          <p className="text-gray-600">Fetching event data and verifying permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Manage event submissions and approvals</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="pending" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50 rounded-lg p-1">
            <TabsTrigger 
              value="pending" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <span className="font-medium">Pending</span>
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {pendingEvents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <span className="font-medium">Approved</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {approvedEvents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            >
              <span className="font-medium">Rejected</span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {rejectedEvents.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-6">
            {pendingEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-orange-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">All caught up!</p>
                <p className="text-muted-foreground">No pending events to review</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <EventCard event={event} showActions={false} />
                    </div>
                    <div className="px-6 pb-6">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(event.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm h-11"
                          disabled={actionLoading === event.id}
                        >
                          {actionLoading === event.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(event.id)}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-11"
                          disabled={actionLoading === event.id}
                        >
                          {actionLoading === event.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteEvent(event.id, event.event_name)}
                          variant="destructive"
                          size="sm"
                          className="px-3"
                          disabled={actionLoading === event.id}
                        >
                          {actionLoading === event.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6 space-y-6">
            {approvedEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-green-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No approved events yet</p>
                <p className="text-muted-foreground">Approved events will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
                    <EventCard event={event} showActions={false} />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Approved</span>
                      </div>
                      <Button
                        onClick={() => handleDeleteEvent(event.id, event.event_name)}
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === event.id}
                      >
                        {actionLoading === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6 space-y-6">
            {rejectedEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">No rejected events</p>
                <p className="text-muted-foreground">Rejected events will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rejectedEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
                    <EventCard event={event} showActions={false} />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                      <Button
                        onClick={() => handleDeleteEvent(event.id, event.event_name)}
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === event.id}
                      >
                        {actionLoading === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
