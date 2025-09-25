import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type SocialMediaBrief = {
  ad_targeting_topics: string[];
  hashtags: string[];
  micro_share_ideas: string[];
  keywords: string[];
  transcript?: string;
};

type TaggedUser = {
  full_name: string;
  id: string;
  is_private: boolean;
  is_verified: boolean;
  profile_pic_id: string;
  profile_pic_url: string;
  username: string;
};

type MusicInfo = {
  audio_canonical_id: string;
  audio_type: string | null;
  music_info: string | null;
  original_sound_info: string | null;
  pinned_media_ids: string | null;
};

type RelatedPost = {
  inputUrl: string;
  id: string;
  type: string;
  shortCode: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  url: string;
  commentsCount: number;
  firstComment: string;
  latestComments: string[];
  dimensionsHeight: number;
  dimensionsWidth: number;
  displayUrl: string;
  images: string[];
  likesCount: number;
  timestamp: string;
  childPosts: string[];
  locationName: string;
  locationId: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerId: string;
  productType: string;
  isSponsored: boolean;
  taggedUsers: TaggedUser[];
  musicInfo: MusicInfo;
  creator_details: CreatorDetails;
};

type CreatorDetails = {
  inputUrl: string;
  id: string;
  username: string;
  url: string;
  fullName: string;
  biography: string;
  externalUrls: ExternalUrl[];
  externalUrl: string;
  externalUrlShimmed: string;
  followersCount: number;
  followsCount: number;
  hasChannel: boolean;
  highlightReelCount: number;
  isBusinessAccount: boolean;
  joinedRecently: boolean;
  businessCategoryName: string;
  private: boolean;
  verified: boolean;
  profilePicUrl: string;
  profilePicUrlHD: string;
  igtvVideoCount: number;
  postsCount: number;
  fbid: string;
};

type ExternalUrl = {
  title: string;
  lynx_url: string;
  url: string;
  link_type: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function PostInsight() {
  const [inputMode, setInputMode] = useState<"blog" | "video">("blog");
  const [blogText, setBlogText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [brief, setBrief] = useState<SocialMediaBrief | null>(null);

  const [isFetchingRelated, setIsFetchingRelated] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canAnalyze = useMemo(() => {
    if (inputMode === "blog") {
      return blogText.trim().length > 0;
    }
    // video mode: either url or file
    return videoUrl.trim().length > 0 || !!videoFile;
  }, [inputMode, blogText, videoUrl, videoFile]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setBrief(null);
    setRelatedPosts([]);
    setRelatedError(null);

    try {
      let response: Response;
      if (inputMode === "blog") {
        response = await fetch(`${API_BASE_URL}/analyze/blogpost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: blogText }),
        });
      } else {
        // video: send url or file
        if (videoFile) {
          const form = new FormData();
          form.append("file", videoFile);
          if (videoUrl.trim()) form.append("url", videoUrl.trim());
          response = await fetch(`${API_BASE_URL}/analyze/video`, {
            method: "POST",
            body: form,
          });
        } else {
          const form = new FormData();
          form.append("url", videoUrl);
          response = await fetch(`${API_BASE_URL}/analyze/video`, {
            method: "POST",
            body: form,
          });
        }
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Analyze failed: ${response.status}`);
      }
      const data = await response.json();
      setBrief(data as SocialMediaBrief);
    } catch (err: any) {
      setAnalyzeError(err?.message || "Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRelatedPosts = async () => {
    if (!brief || !brief.keywords?.length) return;
    setIsFetchingRelated(true);
    setRelatedError(null);
    setRelatedPosts([]);
    try {
      const response = await fetch(`${API_BASE_URL}/related-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: brief.keywords }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Related posts failed: ${response.status}`);
      }
      const data = await response.json();
      const list: RelatedPost[] = Array.isArray(data)
        ? data
        : Object.values(data);
      setRelatedPosts(list);
    } catch (err: any) {
      setRelatedError(err?.message || "Failed to fetch related posts");
    } finally {
      setIsFetchingRelated(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(340px, 420px) 1fr",
        gap: 24,
        minHeight: "calc(100vh - 72px)",
      }}
    >
      <aside
        style={{
          position: "sticky",
          top: 24,
          alignSelf: "start",
          padding: 20,
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          background: "var(--card-bg, #fff)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Post Insight</h2>
        <p style={{ marginTop: 0, color: "#666" }}>
          Analyze a blog post or a video to generate a social media brief.
        </p>

        <div
          style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 12 }}
        >
          <button
            type="button"
            onClick={() => setInputMode("blog")}
            aria-pressed={inputMode === "blog"}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background:
                inputMode === "blog" ? "rgba(100,119,255,0.12)" : "transparent",
            }}
          >
            Blog Post
          </button>
          <button
            type="button"
            onClick={() => setInputMode("video")}
            aria-pressed={inputMode === "video"}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background:
                inputMode === "video"
                  ? "rgba(100,119,255,0.12)"
                  : "transparent",
            }}
          >
            Video / URL
          </button>
        </div>

        <form onSubmit={handleAnalyze} style={{ display: "grid", gap: 12 }}>
          {inputMode === "blog" ? (
            <label style={{ display: "grid", gap: 6 }}>
              <span>Blog post text</span>
              <textarea
                rows={12}
                placeholder="Paste your blog post text here..."
                value={blogText}
                onChange={(e) => setBlogText(e.target.value)}
                required
                style={{ resize: "vertical" }}
              />
            </label>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Video URL</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </label>
              <div style={{ display: "grid", gap: 6 }}>
                <span>Or upload video file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                {videoFile && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#555",
                    }}
                  >
                    <span style={{ fontSize: 12 }}>Selected:</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {videoFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      style={{ fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={!canAnalyze || isAnalyzing}>
            {isAnalyzing ? "Analyzing…" : "Analyze"}
          </button>
          {analyzeError && (
            <div style={{ color: "crimson" }}>{analyzeError}</div>
          )}
          <div style={{ color: "#777", fontSize: 12 }}>
            Provide either blog text or a video URL/file.
          </div>
        </form>
      </aside>

      <main style={{ padding: 4 }}>
        {!brief && !isAnalyzing && (
          <div style={{ color: "#666" }}>
            No analysis yet. Submit content to see insights.
          </div>
        )}
        {isAnalyzing && (
          <div className="loading-center">
            <div className="spinner" />
            <div>Analyzing content…</div>
            <div style={{ color: "#666", maxWidth: 480 }}>
              This can take some time. Please keep this tab open.
            </div>
          </div>
        )}
        {brief && !isAnalyzing && (
          <div style={{ display: "grid", gap: 20 }}>
            <section
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                padding: 16,
                background: "var(--card-bg)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 10 }}>
                Social Media Brief
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                <ListBlock
                  title="Ad Targeting Topics"
                  items={brief.ad_targeting_topics}
                />
                <ListBlock title="Hashtags" items={brief.hashtags} />
                <ListBlock
                  title="Micro Share Ideas"
                  items={brief.micro_share_ideas}
                />
                <ListBlock title="Keywords" items={brief.keywords} />
              </div>
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={handleRelatedPosts}
                  disabled={isFetchingRelated}
                >
                  {isFetchingRelated
                    ? "Finding related posts…"
                    : "Generate Related Posts"}
                </button>
              </div>
              {relatedError && (
                <div style={{ color: "crimson", marginTop: 8 }}>
                  {relatedError}
                </div>
              )}
            </section>

            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h3 style={{ margin: 0 }}>Related Posts</h3>
                {!isFetchingRelated && relatedPosts.length > 0 && (
                  <div style={{ color: "#666", fontSize: 12 }}>
                    {relatedPosts.length} result
                    {relatedPosts.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              {!isFetchingRelated && relatedPosts.length === 0 && (
                <div style={{ color: "#666" }}>
                  No related posts yet. Click the button above.
                </div>
              )}
              {isFetchingRelated && (
                <div className="loading-center">
                  <div className="spinner" />
                  <div>Loading related posts…</div>
                </div>
              )}
              {!isFetchingRelated && relatedPosts.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 16,
                  }}
                >
                  {relatedPosts.map((p) => (
                   <RelatedPostItem post={p} keywords={brief.keywords} originalPostText={blogText || brief?.transcript || ''} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ListBlock({
  title,
  items,
  prefix,
}: {
  title: string;
  items: string[] | undefined;
  prefix?: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div style={{ fontWeight: 700, color: "#222", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((item, idx) => (
          <span
            key={idx}
            style={{
              fontSize: 12,
              background: "var(--chip-bg)",
              color: "var(--text-secondary)",
              padding: "4px 8px",
              borderRadius: 999,
              cursor: "pointer",
              userSelect: "none",
            }}
            title="Copy to clipboard"
            onClick={()=>{
                navigator.clipboard.writeText(item);
                toast.success("Copied to clipboard");
            }}
          >
            {prefix}
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function RelatedPostItem({ post, keywords, originalPostText }: { post: RelatedPost, keywords: string[], originalPostText: string }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedComment, setGeneratedComment] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  const handleGenerateComment = async () => {
    setIsGenerating(true)
    setGenError(null)
    try {
   
      const res = await fetch(`${API_BASE_URL}/generate-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({post, keywords:keywords.join(', '), prior_post_text: originalPostText }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed: ${res.status}`)
      }
      const data = await res.json()
      const comment: string = data.comment
      setGeneratedComment(comment || 'No comment generated')
      if (comment) toast.success('AI comment generated')
    } catch (e: any) {
      const msg = e?.message || 'Failed to generate comment'
      setGenError(msg)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <li
    key={post.id}
    style={{
      border: "1px solid var(--border-color)",
      borderRadius: 12,
      padding: 12,
      background: "var(--card-bg)",
    }}
  >
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {post.displayUrl ? (
          <img
            src={
              post.displayUrl
                ? `${API_BASE_URL}/proxy-image?url=${encodeURIComponent(
                    post.displayUrl
                  )}`
                : undefined
            }
            alt={post.caption || "thumbnail"}
            width={96}
            height={96}
            style={{
              objectFit: "cover",
              borderRadius: 8,
              background: "#eee",
            }}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              const img = e.currentTarget;
              const svg = encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>\n  <rect width='100%' height='100%' rx='24' ry='24' fill='#e5e7eb'/>\n</svg>`
              );
              img.src = `data:image/svg+xml;charset=UTF-8,${svg}`;
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 8,
              background: "#eee",
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              textDecoration: "none",
            }}
          >
            {post.caption.slice(0, 50) +
              (post.caption.length > 50 ? "..." : "") ||
              post.url ||
              "View Post"}{" "}
            ↗
          </a>
          {post.caption && (
            <p
              style={{
                marginTop: 6,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
                textWrap: "wrap",
                wordBreak: "break-word",
                height: 250,
                overflow: "scroll",
              }}
            >
              {post.caption}
            </p>
          )}
        </div>
      </div>
      {post.type && (
          <div
            style={{
              fontSize: 12,
              background: "var(--chip-bg)",
              color: "var(--text-secondary)",
              padding: "3px 8px",
              borderRadius: 999,
              width: "fit-content",
            }}
          >
            {post.type}
          </div>
        )}
      <a
        href={post.creator_details.url}
        target="_blank"
        rel="noreferrer"
        style={{ color: "inherit" }}
      >
        {post.creator_details && (
          <div
            className=""
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 12,
              background: "var(--card-bg)",
            }}
          >
            <h5 style={{ marginTop: 0, marginBottom: 10 }}>
              Creator Details
            </h5>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {post.creator_details.profilePicUrl ? (
                <img
                  src={`${API_BASE_URL}/proxy-image?url=${encodeURIComponent(
                    post.creator_details.profilePicUrl
                  )}`}
                  alt={post.creator_details.username}
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#eee",
                  }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    const svg = encodeURIComponent(
                      `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>\n  <rect width='100%' height='100%' rx='20' ry='20' fill='#e5e7eb'/>\n</svg>`
                    );
                    img.src = `data:image/svg+xml;charset=UTF-8,${svg}`;
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#eee",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  {post.creator_details.fullName ?? ""}
                  {post.creator_details.fullName &&
                  post.creator_details.username
                    ? " · "
                    : ""}
                  {post.creator_details.username
                    ? `@${post.creator_details.username}`
                    : ""}
                </div>
                {post.creator_details.biography && (
                  <p
                    style={{
                      marginTop: 6,
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-wrap",
                      textWrap: "wrap",
                    }}
                  >
                    {post.creator_details.biography.slice(
                      0,
                      50
                    ) +
                      (post.creator_details.biography.length > 50
                        ? "..."
                        : "")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </a>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>

        <button
          type="button"
          onClick={handleGenerateComment}
          disabled={isGenerating}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title="Generate an AI comment for this post"
        >
          <span aria-hidden>✨</span>
          {isGenerating ? 'Generating…' : 'Generate Comment'}
        </button>
      </div>

      {genError && (
        <div style={{ color: 'crimson' }}>{genError}</div>
      )}

      {generatedComment && (
        <div style={{ border: '1px dashed var(--border-color)', borderRadius: 10, padding: 10, background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontWeight: 600 }}>AI Comment</div>
            <button
              type="button"
              title="Copy comment"
              aria-label="Copy comment"
              onClick={() => { if (generatedComment) { navigator.clipboard.writeText(generatedComment); toast.success('Comment copied'); } }}
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span aria-hidden>📋</span>
              Copy
            </button>
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{generatedComment}</p>
        </div>
      )}
              
    </div>
  </li>
  );
}