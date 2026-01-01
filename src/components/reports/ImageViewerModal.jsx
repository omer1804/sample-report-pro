import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, X } from 'lucide-react';

export default function ImageViewerModal({ imageUrl, isOpen, onClose }) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
        <div className="relative bg-black">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              onClick={handleZoomOut}
              size="icon"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleZoomIn}
              size="icon"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClose}
              size="icon"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-auto max-h-[85vh] flex items-center justify-center p-8">
            <img
              src={imageUrl}
              alt="Zoomed view"
              style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
              className="max-w-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}