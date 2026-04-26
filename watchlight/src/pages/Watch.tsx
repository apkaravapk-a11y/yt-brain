import { useParams } from "react-router-dom";
export default function Watch() {
  const { id } = useParams();
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>
        <div>
          <div className="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Watch"
            />
          </div>
          <h1 className="text-xl font-medium text-on-surface mt-4">Video {id}</h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Transcript and AI extract appear in the right panel as the video plays.
            Click any word in the transcript to jump the playhead.
          </p>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary"><span className="material-symbols-rounded">auto_fix_high</span> Extract techniques</button>
            <button className="btn"><span className="material-symbols-rounded">commit</span> Propose to repo</button>
            <button className="btn"><span className="material-symbols-rounded">bookmark_add</span> Save</button>
          </div>
        </div>
        <aside className="elev-2 rounded-2xl p-5 h-fit sticky top-24">
          <div className="text-sm font-medium text-on-surface mb-3">Transcript</div>
          <div className="space-y-2 text-sm text-on-surface-variant max-h-[60vh] overflow-y-auto">
            <p>Auto-scrolls to playhead. Hover any line for a deep-link timestamp.</p>
            {[...Array(20)].map((_, i) => (
              <div key={i} className="hover:bg-surface-3 rounded px-2 py-1 cursor-pointer">
                <span className="text-primary text-xs mr-2">{Math.floor(i * 23 / 60)}:{String(i * 23 % 60).padStart(2, "0")}</span>
                Line {i + 1} of the auto-generated transcript.
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
