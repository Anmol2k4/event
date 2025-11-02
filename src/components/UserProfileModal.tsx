import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  ExternalLink,
  Star,
  Building
} from "lucide-react";

interface UserProfileModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    location?: string;
    company?: string;
    position?: string;
    bio?: string;
    experience?: string;
    skills?: string;
    profile_photo?: string;
    linkedin?: string;
    portfolio?: string;
    createdAt?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <Avatar className="w-20 h-20">
                  <AvatarImage 
                    src={user.profile_photo ? `/api/users/photo/${user.profile_photo}` : ''} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-primary">{user.name}</h3>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Badge variant="secondary" className="w-fit">
                      {user.role}
                    </Badge>
                    {user.createdAt && (
                      <Badge variant="outline" className="w-fit text-xs">
                        Interested on {formatDate(user.createdAt)}
                      </Badge>
                    )}
                  </div>
                  
                  {user.position && user.company && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground justify-center sm:justify-start">
                      <Building className="h-4 w-4" />
                      <span>{user.position} at {user.company}</span>
                    </div>
                  )}
                  
                  {user.location && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground justify-center sm:justify-start">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          {(user.bio || user.experience || user.skills) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.bio && (
                  <div>
                    <h4 className="font-medium text-sm text-primary mb-2">Bio</h4>
                    <p className="text-sm text-muted-foreground">{user.bio}</p>
                  </div>
                )}
                
                {user.experience && (
                  <div>
                    <h4 className="font-medium text-sm text-primary mb-2">Experience & Achievements</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{user.experience}</p>
                  </div>
                )}
                
                {user.skills && (
                  <div>
                    <h4 className="font-medium text-sm text-primary mb-2">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.split(',').map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Professional Links */}
          {(user.linkedin || user.portfolio) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.linkedin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  </Button>
                )}
                
                {user.portfolio && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a href={user.portfolio} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Portfolio/Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileModal;