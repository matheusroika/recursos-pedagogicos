import { Link2, FileText, Image as ImageIcon, Video } from "lucide-react";

const typeToImage: Record<string, string> = {
  document: "/images/material-document.svg",
  pdf: "/images/material-document.svg",
  image: "/images/material-image.svg",
  video: "/images/material-video.svg",
  link: "/images/material-link.svg"
};

function TypeIcon({ type }: { type: string }) {
  if (type === "video") return <Video size={16} aria-hidden="true" />;
  if (type === "image") return <ImageIcon size={16} aria-hidden="true" />;
  if (type === "link") return <Link2 size={16} aria-hidden="true" />;
  return <FileText size={16} aria-hidden="true" />;
}

export function MaterialThumbnail({
  type,
  title,
  className,
  loading = "lazy",
  size = "list"
}: {
  type: string;
  title: string;
  className?: string;
  loading?: "eager" | "lazy";
  size?: "list" | "detail";
}) {
  const src = typeToImage[type] || typeToImage.document;

  return (
    <div className={`material-media material-media-${size} ${className || ""}`.trim()}>
      <img
        src={src}
        alt={`Capa ilustrativa do material ${title}`}
        width={960}
        height={540}
        loading={loading}
        className="material-media-image"
      />
      <span className="material-media-type">
        <TypeIcon type={type} />
        <span>{type.toUpperCase()}</span>
      </span>
    </div>
  );
}
