/* eslint-disable @next/next/no-img-element */
interface ImageBlockProps {
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
}

export function ImageBlock({ props, styles }: ImageBlockProps) {
  const src = props.src as string | undefined;
  const alt = (props.alt as string) ?? '';
  const caption = props.caption as string | undefined;

  return (
    <figure style={styles} className="px-8 py-8">
      <div className="mx-auto max-w-4xl">
        {src ? (
          <img src={src} alt={alt} className="w-full rounded-lg object-cover" />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <span className="text-sm text-gray-400">Image placeholder</span>
          </div>
        )}
        {caption && (
          <figcaption className="mt-3 text-center text-sm text-gray-500">{caption}</figcaption>
        )}
      </div>
    </figure>
  );
}
