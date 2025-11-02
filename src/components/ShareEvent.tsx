import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Share2, Twitter, Facebook, Linkedin, Copy, Mail } from "lucide-react";
import { toast } from "sonner";

interface ShareEventProps {
  event: {
    id: string;
    event_name: string;
    event_date: string;
    location: string;
    requirements: string;
  };
  variant?: "outline" | "default" | "ghost";
  size?: "default" | "sm" | "lg";
}

const ShareEvent = ({ event, variant = "outline", size = "sm" }: ShareEventProps) => {
  const eventUrl = `${window.location.origin}/events/${event.id}`;
  const eventTitle = encodeURIComponent(event.event_name);
  const eventDescription = encodeURIComponent(event.requirements);
  const eventDate = new Date(event.event_date).toLocaleDateString();

  const shareText = encodeURIComponent(
    `Join me at "${event.event_name}" on ${eventDate} at ${event.location}! ${eventDescription.slice(0, 100)}${eventDescription.length > 100 ? '...' : ''}`
  );

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(eventUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${shareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}&title=${eventTitle}&summary=${shareText}`,
    email: `mailto:?subject=${eventTitle}&body=${shareText}%0A%0A${eventUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_name,
          text: `Join me at "${event.event_name}" on ${eventDate} at ${event.location}!`,
          url: eventUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share event');
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Share this event</h4>
            <p className="text-sm text-muted-foreground">
              Spread the word about {event.event_name}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="gap-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="gap-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="gap-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('email')}
              className="gap-2 hover:bg-gray-50 hover:border-gray-200"
            >
              <Mail className="h-4 w-4 text-gray-600" />
              Email
            </Button>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
              <span className="flex-1 truncate">{eventUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="gap-1 shrink-0"
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>
          
          {navigator.share && (
            <Button
              variant="default"
              size="sm"
              onClick={handleNativeShare}
              className="w-full gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share via System
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareEvent;