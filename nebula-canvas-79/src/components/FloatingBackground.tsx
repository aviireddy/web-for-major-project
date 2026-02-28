import { useEffect, useState } from "react";
import dogImg from "@/assets/dog.jpg";
import catImg from "@/assets/cat.jpg";
import clothesImg from "@/assets/clothes.jpg";
import booksImg from "@/assets/books.jpg";

const images = [dogImg, catImg, clothesImg, booksImg];

interface FloatingImage {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  duration: number;
  delay: number;
  size: number;
}

export const FloatingBackground = () => {
  const [floatingImages, setFloatingImages] = useState<FloatingImage[]>([]);

  useEffect(() => {
    const imageElements: FloatingImage[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      src: images[Math.floor(Math.random() * images.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      duration: 20 + Math.random() * 15,
      delay: Math.random() * 5,
      size: 80 + Math.random() * 60,
    }));
    setFloatingImages(imageElements);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
      {floatingImages.map((img) => (
        <div
          key={img.id}
          className="absolute animate-float"
          style={{
            left: `${img.x}%`,
            top: `${img.y}%`,
            animation: `float ${img.duration}s ease-in-out infinite`,
            animationDelay: `${img.delay}s`,
            transform: `rotate(${img.rotation}deg)`,
          }}
        >
          <img
            src={img.src}
            alt=""
            className="rounded-lg border-2 border-primary/30"
            style={{ width: `${img.size}px`, height: `${img.size}px`, objectFit: "cover" }}
          />
        </div>
      ))}
    </div>
  );
};
