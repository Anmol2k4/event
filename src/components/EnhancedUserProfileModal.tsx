import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar,
  ExternalLink,
  Star,
  Building,
  Award,
  Globe,
  Users,
  Clock,
  Target,
  Zap
} from "lucide-react";

interface EnhancedUserProfileModalProps {
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

const EnhancedUserProfileModal: React.FC<EnhancedUserProfileModalProps> = ({ user, isOpen, onClose }) => {
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

  const skillsArray = user.skills ? user.skills.split(',').map(s => s.trim()) : [];
  const experienceLines = user.experience ? user.experience.split('\n').filter(line => line.trim()) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            Detailed User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Profile Header */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-lg">
                    <AvatarImage 
                      src={user.profile_photo ? `/api/users/photo/${user.profile_photo}` : ''} 
                      alt={user.name} 
                    />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
                
                <div className="flex-1 text-center lg:text-left space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-primary mb-2">{user.name}</h2>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      <Badge variant="default" className="text-base px-4 py-2 font-semibold">
                        {user.role}
                      </Badge>
                      {user.createdAt && (
                        <Badge variant="outline" className="text-sm px-3 py-2">
                          <Calendar className="h-4 w-4 mr-2" />
                          Interested {formatDate(user.createdAt)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {user.position && user.company && (
                    <div className="bg-white/50 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center gap-3 text-lg justify-center lg:justify-start">
                        <Building className="h-6 w-6 text-primary" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-bold text-primary">{user.position}</span>
                          <span className="text-muted-foreground">at</span>
                          <span className="font-semibold">{user.company}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {user.location && (
                    <div className="flex items-center gap-2 text-base text-muted-foreground justify-center lg:justify-start">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium">{user.location}</span>
                    </div>
                  )}

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center bg-white/70 rounded-lg p-3 border border-primary/10">
                      <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                        <Award className="h-5 w-5" />
                        {experienceLines.length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Experiences</div>
                    </div>
                    <div className="text-center bg-white/70 rounded-lg p-3 border border-primary/10">
                      <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                        <Zap className="h-5 w-5" />
                        {skillsArray.length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Skills</div>
                    </div>
                    <div className="text-center bg-white/70 rounded-lg p-3 border border-primary/10">
                      <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                        <Globe className="h-5 w-5" />
                        {(user.linkedin ? 1 : 0) + (user.portfolio ? 1 : 0)}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Links</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information - Enhanced */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
              </div>
              
              {user.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="font-semibold">{user.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Details */}
          {(user.bio || user.experience || user.skills) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bio & Experience */}
              <div className="space-y-4">
                {user.bio && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        About
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
                    </CardContent>
                  </Card>
                )}
                
                {user.experience && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-500" />
                        Experience & Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {experienceLines.map((exp, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-muted-foreground">{exp}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Skills */}
              {user.skills && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="px-3 py-1 text-sm border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
                        >
                          <Target className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Professional Links */}
          {(user.linkedin || user.portfolio) && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-orange-500" />
                  Professional Links
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                {user.linkedin && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 p-4 h-auto border-blue-200 hover:bg-blue-50"
                    asChild
                  >
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-blue-700">LinkedIn Profile</div>
                        <div className="text-sm text-muted-foreground">Professional Network</div>
                      </div>
                    </a>
                  </Button>
                )}
                
                {user.portfolio && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 p-4 h-auto border-green-200 hover:bg-green-50"
                    asChild
                  >
                    <a href={user.portfolio} target="_blank" rel="noopener noreferrer">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Globe className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-green-700">Portfolio/Website</div>
                        <div className="text-sm text-muted-foreground">Personal Work</div>
                      </div>
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interest Timeline */}
          {user.createdAt && (
            <Card className="bg-gradient-to-r from-muted/50 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-center justify-center">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Interest Registered</p>
                    <p className="text-sm text-muted-foreground">
                      This user showed interest on {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedUserProfileModal;