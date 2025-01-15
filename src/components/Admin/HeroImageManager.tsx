import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

// Import local hero images
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

// Local hero images configuration
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

// ImgBB API key
const IMGBB_API_KEY = "b88426f490b59a86f19b88d361c19292";

export default function HeroImageManager() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newAlt, setNewAlt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    try {
      const heroImagesRef = collection(db, "heroImages");
      const q = query(heroImagesRef, orderBy("order", "asc"));
      const snapshot = await getDocs(q);

      // If collection is empty, initialize it with local images
      if (snapshot.empty) {
        console.log("Initializing heroImages collection with local images...");
        const batch = writeBatch(db);

        localHeroImages.forEach((image) => {
          const docRef = doc(heroImagesRef);
          batch.set(docRef, {
            url: image.url,
            alt: image.alt,
            order: image.order,
            timestamp: new Date().toISOString(),
            isLocal: true,
          });
        });

        await batch.commit();
      }

      // Always load images from database
      const finalSnapshot = await getDocs(q);
      const dbImages = finalSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HeroImage[];

      setImages(dbImages.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error loading images:", error);
      setError("Failed to load images. Please try again.");
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files?.[0]) {
      setError("Please select an image to upload");
      return;
    }

    if (!newAlt) {
      setError("Please enter an image description");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const file = fileInput.files[0];
      console.log("Starting upload for file:", file.name, "size:", file.size);

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      const base64Image = (base64Data as string).split(",")[1];

      console.log("File converted to base64, sending to ImgBB...");

      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY);
      formData.append("image", base64Image);

      // Upload to ImgBB
      const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      if (!imgbbResponse.ok) {
        throw new Error(`ImgBB upload failed: ${imgbbResponse.statusText}`);
      }

      const imgbbData = await imgbbResponse.json();

      if (!imgbbData.data?.url) {
        throw new Error("Failed to get image URL from ImgBB");
      }

      // Get the current maximum order
      const heroImagesRef = collection(db, "heroImages");
      const q = query(heroImagesRef, orderBy("order", "desc"), limit(1));
      const orderSnapshot = await getDocs(q);
      let maxOrder = 0;

      if (!orderSnapshot.empty) {
        const lastDoc = orderSnapshot.docs[0].data();
        if (!lastDoc.isTest) {
          // Ignore test document for order calculation
          maxOrder = lastDoc.order + 1;
        }
      }

      // Add to Firestore heroImages collection
      await addDoc(heroImagesRef, {
        url: imgbbData.data.url,
        alt: newAlt,
        order: maxOrder,
        timestamp: new Date().toISOString(),
        isLocal: false,
      });

      // Reset form
      setNewAlt("");
      fileInput.value = "";

      // Reload images
      await loadImages();
      setError(null);
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: HeroImage) => {
    if (image.isLocal) {
      setError("Default images cannot be deleted");
      return;
    }

    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await deleteDoc(doc(db, "heroImages", image.id));
      await loadImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Failed to delete image. Please try again.");
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state
    setImages(items);

    try {
      // Update all images in Firestore with new orders
      const batch = writeBatch(db);

      items.forEach((image, index) => {
        const docRef = doc(db, "heroImages", image.id);
        batch.update(docRef, { order: index });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. Please try again.");
      loadImages();
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl text-white mb-6">Manage Hero Images</h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="hero-images">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4"
            >
              {images.map((image, index) => (
                <Draggable key={image.id} draggableId={image.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-gray-700 p-4 rounded-lg flex items-center gap-4 cursor-move"
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-grow">
                        <p className="text-white">{image.alt}</p>
                        <p className="text-gray-400 text-sm">
                          {image.isLocal ? "Local Image" : "Uploaded Image"}
                        </p>
                      </div>
                      {!image.isLocal && (
                        <button
                          onClick={() => handleDelete(image)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
    </div>
  );
}
