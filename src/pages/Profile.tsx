import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Camera, 
  Save, 
  Edit, 
  ArrowLeft,
  Calendar,
  Star
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    experience: '',
    skills: '',
    company: '',
    position: '',
    linkedin: '',
    portfolio: '',
    profile_photo: ''
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    // Test backend connectivity first
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('Backend health check:', data);
        fetchUserProfile();
      })
      .catch(err => {
        console.error('Backend not reachable:', err);
        toast.error('Cannot connect to server. Please ensure the backend is running.');
      });
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Fetching profile from /api/users/profile');
      const res = await fetch('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Profile response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Profile fetch error:', errorText);
        throw new Error(`Failed to fetch profile: ${res.status} ${errorText}`);
      }

      const userData = await res.json();
      console.log('Profile data received:', userData);
      setUser(userData);
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || '',
        experience: userData.experience || '',
        skills: userData.skills || '',
        company: userData.company || '',
        position: userData.position || '',
        linkedin: userData.linkedin || '',
        portfolio: userData.portfolio || '',
        profile_photo: userData.profile_photo || ''
      });
      setPhotoPreview(userData.profile_photo ? `/api/users/photo/${userData.profile_photo}` : '');
      console.log('Profile state initialized successfully');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Image size should be less than 2MB');
      return;
    }

    setProfilePhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      console.log('Starting profile save...');

      // Upload profile photo if changed
      let photoFilename = profileData.profile_photo;
      if (profilePhotoFile) {
        console.log('Uploading profile photo...');
        const photoFormData = new FormData();
        photoFormData.append('photo', profilePhotoFile);

        const photoRes = await fetch('/api/users/upload-photo', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: photoFormData
        });

        console.log('Photo upload response status:', photoRes.status);
        
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          photoFilename = photoData.filename;
          console.log('Photo uploaded successfully:', photoFilename);
        } else {
          const photoError = await photoRes.text();
          console.error('Photo upload failed:', photoError);
        }
      }

      // Update profile data
      const updatedProfile = { ...profileData, profile_photo: photoFilename };
      console.log('Updating profile with data:', updatedProfile);
      
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
      });

      console.log('Profile update response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Profile update error:', errorText);
        throw new Error(`Failed to update profile: ${res.status} ${errorText}`);
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setProfileData(updatedProfile);
      setEditing(false);
      setProfilePhotoFile(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-primary">My Profile</h1>
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <Button onClick={() => {
                  console.log('Edit button clicked');
                  setEditing(true);
                }} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditing(false);
                      setProfilePhotoFile(null);
                      setPhotoPreview(profileData.profile_photo ? `/api/users/photo/${profileData.profile_photo}` : '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Profile Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage 
                      src={photoPreview} 
                      alt={profileData.name || 'User'} 
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profileData.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="profile-photo"
                      />
                      <Label htmlFor="profile-photo" className="cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <span>
                            <Camera className="h-4 w-4" />
                            Change Photo
                          </span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {user?.role || 'Not specified'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position/Title</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell us about yourself and your professional background..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  disabled={!editing}
                />
              </div>

              <div>
                <Label htmlFor="experience">Experience & Achievements</Label>
                <Textarea
                  id="experience"
                  rows={4}
                  placeholder="Describe your relevant experience, past projects, and notable achievements..."
                  value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                  disabled={!editing}
                />
              </div>

              <div>
                <Label htmlFor="skills">Skills & Expertise</Label>
                <Textarea
                  id="skills"
                  rows={3}
                  placeholder="List your skills, expertise areas, and specializations (comma separated)..."
                  value={profileData.skills}
                  onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Links & Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Professional Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio">Portfolio/Website</Label>
                  <Input
                    id="portfolio"
                    placeholder="https://yourwebsite.com"
                    value={profileData.portfolio}
                    onChange={(e) => setProfileData({ ...profileData, portfolio: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;