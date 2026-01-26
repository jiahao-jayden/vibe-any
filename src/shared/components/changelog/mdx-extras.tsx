import type { ComponentProps } from "react"

function Video(props: ComponentProps<"video"> & { src: string }) {
  return (
    <div className="rounded-xl overflow-hidden border bg-black/80">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        controls
        playsInline
        style={{ width: "100%", height: "auto" }}
        {...props}
      />
    </div>
  )
}

export const mdxExtras = { Video }
