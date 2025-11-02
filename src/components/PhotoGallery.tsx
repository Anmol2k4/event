import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, User, Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface Photo {
  _id: string;
  filename: string;
  original_name: string;
  caption: string;
  user_name: string;
  event_title: string;
  file_size: number;
  createdAt: string;
}

interface PhotoGalleryProps {
  eventId: string;
  refreshTrigger?: number;
}

const PhotoGallery = ({ eventId, refreshTrigger }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [eventId, refreshTrigger]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/photos/event/${eventId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoDialog = (photo: Photo) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading photos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Event Photos
            <Badge variant="secondary">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No photos have been shared for this event yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => openPhotoDialog(photo)}
                >
                  <img
                    src={`/api/photos/file/${photo.filename}`}
                    alt={photo.caption || 'Event photo'}
                    className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                      <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle>Photo Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={`/api/photos/file/${selectedPhoto.filename}`}
                    alt={selectedPhoto.caption || 'Event photo'}
                    className="w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  {selectedPhoto.caption && (
                    <div>
                      <h4 className="font-medium">Caption</h4>
                      <p className="text-sm text-muted-foreground">{selectedPhoto.caption}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>By {selectedPhoto.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(selectedPhoto.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <div>
                      <span>{formatFileSize(selectedPhoto.file_size)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGallery;