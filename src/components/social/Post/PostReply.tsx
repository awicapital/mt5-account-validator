"use client";

export function PostReply({ postId }: { postId: string }) {
  return (
    <div className="mt-3">
      <input
        type="text"
        placeholder="Responder..."
        className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
