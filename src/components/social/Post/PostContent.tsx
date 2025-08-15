"use client";

export function PostContent({ content, media }: { content: string; media?: string[] }) {
  return (
    <div className="space-y-2 mt-1 text-sm leading-snug">
      <p className="whitespace-pre-wrap">{content}</p>
      {media?.length ? (
        <div className="grid grid-cols-1 gap-2 mt-2">
          {media.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="rounded-xl object-cover max-h-[400px] w-full"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
