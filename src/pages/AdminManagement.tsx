import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Shield, UserPlus, Users, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [newAdminData, setNewAdminData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

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
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch("/api/users/create-admin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create admin account');
        setLoading(false);
        return;
      }

      toast.success('Admin account created successfully!');
      setNewAdminData({ name: "", email: "", phone: "", password: "" });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string, userName: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/promote-admin/${userId}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to promote user');
        return;
      }

      toast.success(`${userName} has been promoted to admin`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to promote user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
        return;
      }

      toast.success(`User ${userName} has been deleted successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Admin Access Required</p>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
          <p className="text-gray-600">Manage admin accounts and user permissions</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Admin
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Create New Admin Account
                </CardTitle>
                <CardDescription>
                  Create a new administrator account with full system privileges.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name *</Label>
                      <Input
                        id="admin-name"
                        placeholder="Enter full name"
                        value={newAdminData.name}
                        onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email Address *</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="Enter email address"
                        value={newAdminData.email}
                        onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-phone">Phone Number</Label>
                      <Input
                        id="admin-phone"
                        placeholder="Enter phone number"
                        value={newAdminData.phone}
                        onChange={(e) => setNewAdminData({ ...newAdminData, phone: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password *</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter strong password"
                        value={newAdminData.password}
                        onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Admin...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Admin Account
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  System Users
                </CardTitle>
                <CardDescription>
                  View all users and promote them to admin if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  ) : (
                    users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'Admin' : user.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteUser(user.id, user.name)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Promote to Admin
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="ml-2"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;