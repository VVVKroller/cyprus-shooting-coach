import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  collection,
  getDocs,
  // addDoc,
  // deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  // limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";

// Comment out but keep the imports for future use
/*
import Hero01 from "../../assets/images/hero-photos/Hero_01.webp";
import Hero02 from "../../assets/images/hero-photos/Hero_02.webp";
import Hero03 from "../../assets/images/hero-photos/Hero_03.webp";
import Hero04 from "../../assets/images/hero-photos/Hero_04.webp";

interface HeroImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  isLocal?: boolean;
  isTest?: boolean;
}

const localHeroImages: HeroImage[] = [
  {
    id: "local-hero-1",
    url: Hero01,
    alt: "Hero Image 1",
    order: 0,
    isLocal: true,
  },
  {
    id: "local-hero-2",
    url: Hero02,
    alt: "Hero Image 2",
    order: 1,
    isLocal: true,
  },
  {
    id: "local-hero-3",
    url: Hero03,
    alt: "Hero Image 3",
    order: 2,
    isLocal: true,
  },
  {
    id: "local-hero-4",
    url: Hero04,
    alt: "Hero Image 4",
    order: 3,
    isLocal: true,
  },
];

const IMGBB_API_KEY = "b88426f490b59a86f19b88d361c19292";
*/

export default function HeroImageManager() {
  const [images, setImages] = React.useState<any[]>([]);
  // const [uploading, setUploading] = useState(false);
  // const [newAlt, setNewAlt] = useState("");
  // const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    try {
      const q = query(collection(db, "heroImages"), orderBy("order"));
      const snapshot = await getDocs(q);
      const loadedImages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setImages(loadedImages);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  };

  React.useEffect(() => {
    loadImages();
  }, []);

  /* Comment out upload functionality
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... upload logic ...
  };

  const handleDelete = async (image: HeroImage) => {
    // ... delete logic ...
  };
  */

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImages(items);

    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        const docRef = doc(db, "heroImages", item.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();

      // Reload images to ensure we have the correct order
      await loadImages();
    } catch (error) {
      console.error("Error updating order:", error);
      // Reload images to reset to the correct order if there was an error
      await loadImages();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-800 pb-4">
        Manage Hero Images Order
      </h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="hero-images">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-6 bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700
                        ${
                          snapshot.isDragging
                            ? "shadow-lg ring-2 ring-amber-500/50"
                            : "hover:shadow-md hover:border-amber-500/30"
                        }
                        transition-all duration-200`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-24 h-24 object-cover rounded-lg shadow-sm"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg font-semibold text-white">
                            Image {index + 1}
                          </span>
                          <span className="text-sm text-gray-400">
                            {image.alt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-amber-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Comment out upload UI
      <div className="mt-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            placeholder="Image description"
            className="flex-grow p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="file"
            onChange={handleUpload}
            accept="image/*"
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`px-4 py-2 rounded cursor-pointer ${
              uploading
                ? "bg-gray-600 text-gray-400"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </label>
        </div>
      </div>
      */}
    </div>
  );
}
