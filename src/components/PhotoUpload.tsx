import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadProps {
  eventId: string;
  eventTitle: string;
  onPhotosUploaded?: () => void;
  currentUserId?: string;
  eventOwnerId?: string;
  isEventOwner?: boolean;
}

const PhotoUpload = ({ eventId, eventTitle, onPhotosUploaded, currentUserId, eventOwnerId, isEventOwner }: PhotoUploadProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedFiles.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setCaptions(prev => [...prev, ...new Array(validFiles.length).fill("")]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setCaptions(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    setCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Create a fake event object to reuse handleFileSelect logic
    const fakeEvent = {
      target: {
        files: files
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleFileSelect(fakeEvent);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one photo");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please log in to upload photos");
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting photo upload for event:', eventId);
      console.log('Files to upload:', selectedFiles.length);
      
      const formData = new FormData();
      
      selectedFiles.forEach((file, index) => {
        console.log(`Adding file ${index + 1}:`, file.name, file.size, file.type);
        formData.append('photos', file);
      });
      
      formData.append('captions', JSON.stringify(captions));

      console.log('Sending upload request...');
      const res = await fetch(`/api/photos/upload/${eventId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('Upload error response:', error);
        throw new Error(error.error || `Upload failed with status: ${res.status}`);
      }

      const result = await res.json();
      console.log('Upload successful:', result);

      toast.success(`${selectedFiles.length} photo(s) uploaded successfully!`);
      
      // Reset form
      setSelectedFiles([]);
      setCaptions([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      setOpen(false);
      
      onPhotosUploaded?.();
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photos');
    } finally {
      setLoading(false);
    }
  };

  // Only show photo upload for event owners or if explicitly marked as event owner
  if (!isEventOwner && currentUserId !== eventOwnerId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Camera className="h-4 w-4" />
          Add Photos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos for: {eventTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label>Select Photos</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-sm ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
                {isDragOver ? 'Drop photos here' : 'Click to select photos or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 10 photos, 5MB each, JPG/PNG only
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Photo Previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <Label>Selected Photos ({selectedFiles.length}/10)</Label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex gap-3 p-3 border rounded-lg">
                    <img
                      src={previews[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Input
                        placeholder="Add a caption (optional)"
                        value={captions[index]}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={loading || selectedFiles.length === 0}
              className="flex-1"
            >
              {loading ? 'Uploading...' : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;