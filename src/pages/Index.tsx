import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Star } from "lucide-react";
import EventCard from "@/components/EventCard";

const Index = () => {
  const navigate = useNavigate();
  const [approvedEvents, setApprovedEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchApprovedEvents = async () => {
      try {
        console.log('Index: Fetching approved events');
        const res = await fetch('/api/events');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('Index: Fetched events:', data);
        
        // Filter for approved events
        const approved = Array.isArray(data) ? data.filter(event => event.status === 'approved').slice(0, 6) : [];
        setApprovedEvents(approved);
      } catch (error) {
        console.error('Index: Error fetching events:', error);
        setApprovedEvents([]);
      }
    };

    fetchApprovedEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
              ReqNet
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
              Connecting people's ideas and possibilities
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-primary hover:bg-primary-dark shadow-card hover:shadow-hover transition-all duration-300 text-lg px-8"
            >
              Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              size="lg"
              variant="outline"
              className="border-2 border-secondary text-secondary hover:bg-secondary/10 shadow-soft hover:shadow-card transition-all duration-300 text-lg px-8"
            >
              Create Profile
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm shadow-card hover:shadow-hover transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Connect</h3>
            <p className="text-muted-foreground">
              Find event organizers, vendors, volunteers, and sponsors all in one place
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm shadow-card hover:shadow-hover transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10">
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Discover</h3>
            <p className="text-muted-foreground">
              Browse verified event opportunities and showcase your services
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm shadow-card hover:shadow-hover transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
              <Star className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Grow</h3>
            <p className="text-muted-foreground">
              Build your network and turn ideas into successful events
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Featured Events
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover verified event opportunities
          </p>
        </div>

        {approvedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {approvedEvents.map((event) => (
              <EventCard 
                key={event._id} 
                event={{
                  _id: event._id,
                  id: event._id,
                  title: event.title,
                  description: event.description,
                  event_date: event.event_date,
                  location: event.location,
                  planner_name: event.planner_name || 'Event Organizer',
                  status: event.status,
                  vendors_needed: event.vendors_needed,
                  // Legacy fields for backward compatibility
                  event_type: "Event",
                  event_name: event.title,
                  requirements: event.description,
                  created_by: event.planner_name || 'Event Organizer',
                }} 
                showActions={false} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events available yet</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            onClick={() => navigate("/login")}
            size="lg"
            className="bg-primary hover:bg-primary-dark shadow-card hover:shadow-hover transition-all duration-300"
          >
            View All Events
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
