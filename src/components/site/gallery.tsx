/* eslint-disable @next/next/no-img-element */
interface GalleryProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function Gallery({ props, styles }: GalleryProps) {
  const images = (props.images as Array<{ src: string; alt?: string }>) ?? [];

  return (
    <section style={styles} className="px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.length > 0
            ? images.map((img, i) => (
                <div key={i} className="overflow-hidden rounded-lg">
                  <img src={img.src} alt={img.alt ?? ''} className="h-64 w-full object-cover" />
                </div>
              ))
            : [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
                >
                  <span className="text-sm text-gray-400">Image {i}</span>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
