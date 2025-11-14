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

  // Separate loading/error states for each platform
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);

  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [linkedinPosts, setLinkedinPosts] = useState<any[]>([]);

  const [twitterLoading, setTwitterLoading] = useState(false);
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [twitterPosts, setTwitterPosts] = useState<any[]>([]);

  const [igExpanded, setIgExpanded] = useState(true);
  const [linkedinExpanded, setLinkedinExpanded] = useState(true);
  const [twitterExpanded, setTwitterExpanded] = useState(true);

  // Modal state for comment generation
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentPostText, setCommentPostText] = useState("");
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

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
    setLinkedinPosts([]);
    setTwitterPosts([]);
    setIgError(null);
    setLinkedinError(null);
    setTwitterError(null);

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
    
    // Reset all states
    setRelatedPosts([]);
    setLinkedinPosts([]);
    setTwitterPosts([]);
    setIgError(null);
    setLinkedinError(null);
    setTwitterError(null);

    // Fetch Instagram posts
    const fetchInstagram = async () => {
      setIgLoading(true);
      setIgError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/related-posts/instagram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: brief.keywords }),
        });
        if (response.ok) {
          const data = await response.json();
          const list: RelatedPost[] = Array.isArray(data) ? data : Object.values(data);
          setRelatedPosts(list);
        } else {
          const data = await response.json();
          const error = data.detail || "Failed to load Instagram posts";
          setIgError(error);
        }
      } catch (err: any) {
        setIgError(err?.message || "Failed to fetch Instagram posts");
      } finally {
        setIgLoading(false);
      }
    };

    // Fetch LinkedIn posts
    const fetchLinkedIn = async () => {
      setLinkedinLoading(true);
      setLinkedinError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/related-posts/linkedin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: brief.keywords }),
        });
        if (response.ok) {
          const data = await response.json();
          setLinkedinPosts(Array.isArray(data) ? data : []);
        } else {
          const data = await response.json();
          const error = data.detail || "Failed to load LinkedIn posts";
          setLinkedinError(error);
        }
      } catch (err: any) {
        setLinkedinError(err?.message || "Failed to fetch LinkedIn posts");
      } finally {
        setLinkedinLoading(false);
      }
    };

    // Fetch Twitter posts
    const fetchTwitter = async () => {
      setTwitterLoading(true);
      setTwitterError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/related-posts/twitter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: brief.keywords }),
        });
        if (response.ok) {
          const data = await response.json();
          setTwitterPosts(Array.isArray(data) ? data : []);
        } else {
          const data = await response.json();
          const error = data.detail || "Failed to load Twitter posts";
          setTwitterError(error);
        }
      } catch (err: any) {
        setTwitterError(err?.message || "Failed to fetch Twitter posts");
      } finally {
        setTwitterLoading(false);
      }
    };

    // Fetch all platforms independently (don't wait for each other)
    fetchInstagram();
    fetchLinkedIn();
    fetchTwitter();
  };

  const handleGenerateCommentFromModal = async () => {
    if (!commentPostText.trim()) {
      setCommentError("Please enter post text");
      return;
    }

    setIsGeneratingComment(true);
    setCommentError(null);
    setGeneratedComment(null);

    try {
      const res = await fetch(`${API_BASE_URL}/generate-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: {
            caption: commentPostText,
            platform: "general"
          },
          keywords: brief?.keywords?.join(", ") || "",
          prior_post_text: blogText || brief?.transcript || "",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed: ${res.status}`);
      }

      const data = await res.json();
      const comment: string = data.comment;
      setGeneratedComment(comment || "No comment generated");
      if (comment) toast.success("AI comment generated");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate comment";
      setCommentError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingComment(false);
    }
  };

  const handleCloseModal = () => {
    setIsCommentModalOpen(false);
    setCommentPostText("");
    setGeneratedComment(null);
    setCommentError(null);
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
          alignSelf: "start",
          top: 24,
        }}
      >
        <div style={{ 
                top: 24,
                padding: 20,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                background: "var(--card-bg, #fff)",
        }}>
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

        </div>
        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>
            More tools
          </h3>
          <div style={{ display: "flex", gap: 16 }}>
           <button onClick={() => setIsCommentModalOpen(true)}>Generate comment</button>
          </div>
          
        </div>
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
                  disabled={igLoading || linkedinLoading || twitterLoading}
                >
                  {(igLoading || linkedinLoading || twitterLoading)
                    ? "Finding related posts…"
                    : "Generate Related Posts"}
                </button>
              </div>
            </section>

            <section>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Related Posts</h3>
              {!igLoading && !linkedinLoading && !twitterLoading && 
               relatedPosts.length === 0 && linkedinPosts.length === 0 && twitterPosts.length === 0 && (
                <div style={{ color: "#666" }}>
                  No related posts yet. Click the button above.
                </div>
              )}
              
              <div style={{ display: "grid", gap: 16 }}>
                {/* Instagram Section */}
                <CollapsibleSection
                  title="Instagram"
                  count={relatedPosts.length}
                  isExpanded={igExpanded}
                  onToggle={() => setIgExpanded(!igExpanded)}
                  platform="instagram"
                  isLoading={igLoading}
                  error={igError}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {relatedPosts.map((p) => (
                      <RelatedPostItem
                        key={p.id}
                        post={p}
                        keywords={brief.keywords}
                        originalPostText={blogText || brief?.transcript || ""}
                      />
                    ))}
                  </ul>
                </CollapsibleSection>

                {/* LinkedIn Section */}
                <CollapsibleSection
                  title="LinkedIn"
                  count={linkedinPosts.length}
                  isExpanded={linkedinExpanded}
                  onToggle={() => setLinkedinExpanded(!linkedinExpanded)}
                  platform="linkedin"
                  isLoading={linkedinLoading}
                  error={linkedinError}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 16,
                    }}
                  >
                     {linkedinPosts.map((p) => (
                       <LinkedInPostItem
                         key={p.post_url || p.urn}
                         post={p}
                         keywords={brief.keywords}
                         originalPostText={blogText || brief?.transcript || ""}
                       />
                     ))}
                  </ul>
                </CollapsibleSection>

                {/* Twitter Section */}
                <CollapsibleSection
                  title="X (Twitter)"
                  count={twitterPosts.length}
                  isExpanded={twitterExpanded}
                  onToggle={() => setTwitterExpanded(!twitterExpanded)}
                  platform="twitter"
                  isLoading={twitterLoading}
                  error={twitterError}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 16,
                    }}
                  >
                     {twitterPosts.map((p) => (
                       <TwitterPostItem
                         key={p.id}
                         post={p}
                         keywords={brief.keywords}
                         originalPostText={blogText || brief?.transcript || ""}
                       />
                     ))}
                  </ul>
                </CollapsibleSection>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Comment Generation Modal */}
      {isCommentModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.64)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.53)",
              backdropFilter: "blur(10px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0 }}>Generate Comment</h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#666",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Post Text</span>
                <textarea
                  rows={6}
                  placeholder="Paste the post text you want to comment on..."
                  value={commentPostText}
                  onChange={(e) => setCommentPostText(e.target.value)}
                  style={{
                    resize: "vertical",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  onClick={handleCloseModal}
                  disabled={isGeneratingComment}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                    padding: "8px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateCommentFromModal}
                  disabled={isGeneratingComment || !commentPostText.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isGeneratingComment ? "Generating…" : "Generate Comment"}
                </button>
              </div>

              {commentError && (
                <div
                  style={{
                    color: "crimson",
                    padding: 12,
                    background: "rgba(220, 38, 38, 0.1)",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                >
                  {commentError}
                </div>
              )}

              {generatedComment && (
                <div
                  style={{
                    border: "1px dashed var(--border-color)",
                    borderRadius: 10,
                    padding: 16,
                    background: "var(--card-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Generated Comment</div>
                    <button
                      type="button"
                      title="Copy comment"
                      aria-label="Copy comment"
                      onClick={() => {
                        if (generatedComment) {
                          navigator.clipboard.writeText(generatedComment);
                          toast.success("Comment copied");
                        }
                      }}
                      style={{
                        fontSize: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--border-color)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <span aria-hidden>📋</span>
                      Copy
                    </button>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      color: "var(--text-primary)",
                    }}
                  >
                    {generatedComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

function CollapsibleSection({
  title,
  count,
  isExpanded,
  onToggle,
  platform,
  isLoading,
  error,
  children,
}: {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  platform: "instagram" | "linkedin" | "twitter";
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  const platformColors = {
    instagram: "#E4405F",
    linkedin: "#0077B5",
    twitter: "#1DA1F2",
  };

  const platformEmojis = {
    instagram: "📷",
    linkedin: "💼",
    twitter: "🐦",
  };

  // Don't show section if no data, not loading, and no error
  if (!isLoading && count === 0 && !error) {
    return null;
  }

  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 16,
        background: "var(--card-bg)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          marginBottom: isExpanded ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>{platformEmojis[platform]}</span>
          <h4
            style={{
              margin: 0,
              color: platformColors[platform],
              fontSize: 18,
            }}
          >
            {title}
          </h4>
          {isLoading ? (
            <span
              style={{
                fontSize: 12,
                color: "#666",
                background: "rgba(100,119,255,0.1)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Loading...
            </span>
          ) : error ? (
            <span
              style={{
                fontSize: 12,
                color: "#dc2626",
                background: "rgba(220,38,38,0.1)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Error
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                color: "#666",
                background: "rgba(0,0,0,0.05)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {count} post{count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ fontSize: 20, color: "#999" }}>
          {isExpanded ? "−" : "+"}
        </span>
      </button>
      {isExpanded && (
        <div>
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
              <div className="spinner" style={{ width: 24, height: 24 }} />
              <span style={{ color: "#666" }}>Loading {title} posts...</span>
            </div>
          )}
          {error && (
            <div
              style={{
                color: "#dc2626",
                background: "rgba(220,38,38,0.05)",
                padding: 12,
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
          {!isLoading && !error && children}
        </div>
      )}
    </div>
  );
}

function RelatedPostItem({
  post,
  keywords,
  originalPostText,
}: {
  post: RelatedPost;
  keywords: string[];
  originalPostText: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const handleGenerateComment = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          keywords: keywords.join(", "),
          prior_post_text: originalPostText,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed: ${res.status}`);
      }
      const data = await res.json();
      const comment: string = data.comment;
      setGeneratedComment(comment || "No comment generated");
      if (comment) toast.success("AI comment generated");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate comment";
      setGenError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

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
                      {post.creator_details.biography.slice(0, 50) +
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handleGenerateComment}
            disabled={isGenerating}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            title="Generate an AI comment for this post"
          >
            <span aria-hidden>✨</span>
            {isGenerating ? "Generating…" : "Generate Comment"}
          </button>
        </div>

        {genError && <div style={{ color: "crimson" }}>{genError}</div>}

        {generatedComment && (
          <div
            style={{
              border: "1px dashed var(--border-color)",
              borderRadius: 10,
              padding: 10,
              background: "var(--card-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>AI Comment</div>
              <button
                type="button"
                title="Copy comment"
                aria-label="Copy comment"
                onClick={() => {
                  if (generatedComment) {
                    navigator.clipboard.writeText(generatedComment);
                    toast.success("Comment copied");
                  }
                }}
                style={{
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>📋</span>
                Copy
              </button>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {generatedComment}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function LinkedInPostItem({ post, keywords, originalPostText }: { post: any; keywords: string[]; originalPostText: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const images = post.content.ttype === "image" ? [...post.content.images.map((image: any) => image.url)]
   : post.content.type === "video" ? [post.content.thumbnail_url]
   : [];
   const numLikes = post.stats.reactions.reduce((count: number, reaction: any) => count + reaction.count, 0);
   const numComments = post.stats.comments || 0;
   const numShares = post.stats.shares || 0;

  const handleGenerateComment = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: { 
            caption: post.text,
            post_url: post.post_url,
            likesCount: numLikes,
            commentsCount: numComments,
            images: images,
            platform: "linkedin" 
          },
          keywords: keywords.join(", "),
          prior_post_text: originalPostText,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed: ${res.status}`);
      }
      const data = await res.json();
      const comment: string = data.comment;
      setGeneratedComment(comment || "No comment generated");
      if (comment) toast.success("AI comment generated");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate comment";
      setGenError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <li
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 12,
        background: "var(--card-bg)",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <a
          href={post.post_url || "#"}
          target="_blank"
          rel="noreferrer"
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          LinkedIn Post 
          ↗
          <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>({post.posted_at.display_text})</span>

        </a>

        {post.text && (
          <p
            style={{
              marginTop: 6,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              textWrap: "wrap",
              wordBreak: "break-word",
              maxHeight: 250,
              overflow: "auto",
            }}
          >
            {post.text}
          </p>
        )}

        {images.length > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            {images.map((image: string) => (
              <img src={image} alt="Post" width={100} height={100} style={{ objectFit: "cover", borderRadius: 8, background: "#eee" }} />
            ))}
          </div>
        )}

        {post.author && (
          <div
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 12,
              background: "var(--card-bg)",
            }}
          >
            <h5 style={{ marginTop: 0, marginBottom: 10 }}>Author</h5>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {post.author.profile_picture && (
                <img
                  src={post.author.profile_picture}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#eee",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{post.author.name}</div>
                {post.author.headline && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 4,
                    }}
                  >
                    {post.author.headline}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

         {(numLikes || numComments || numShares) && (
           <div
             style={{
               display: "flex",
               gap: 16,
               fontSize: 12,
               color: "var(--text-secondary)",
             }}
           >
             {numLikes > 0 && <span aria-label={`${numLikes} likes`}>👍 {numLikes}</span>}
             {numComments > 0 && <span aria-label={`${numComments} comments`}>💬 {numComments}</span>}
             {numShares > 0 && <span aria-label={`${numShares} shares`}>🔄 {numShares}</span>}
           </div>
         )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handleGenerateComment}
            disabled={isGenerating}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            title="Generate an AI comment for this post"
          >
            <span aria-hidden>✨</span>
            {isGenerating ? "Generating…" : "Generate Comment"}
          </button>
        </div>

        {genError && <div style={{ color: "crimson" }}>{genError}</div>}

        {generatedComment && (
          <div
            style={{
              border: "1px dashed var(--border-color)",
              borderRadius: 10,
              padding: 10,
              background: "var(--card-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>AI Comment</div>
              <button
                type="button"
                title="Copy comment"
                aria-label="Copy comment"
                onClick={() => {
                  if (generatedComment) {
                    navigator.clipboard.writeText(generatedComment);
                    toast.success("Comment copied");
                  }
                }}
                style={{
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>📋</span>
                Copy
              </button>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {generatedComment}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function TwitterPostItem({ post, keywords, originalPostText }: { post: any; keywords: string[]; originalPostText: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Format Twitter date to human-friendly format
  const formatTwitterDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      // Twitter date format: "Sat Nov 08 21:29:14 +0000 2025"
      // Parse the date string
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMins < 1) {
        return "just now";
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else if (diffWeeks < 4) {
        return `${diffWeeks}w ago`;
      } else if (diffMonths < 12) {
        return `${diffMonths}mo ago`;
      } else {
        // For older dates, show formatted date
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
      }
    } catch {
      return null;
    }
  };

  const formattedDate = formatTwitterDate(post.created_at);

  const handleGenerateComment = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: {
            caption: post.text,
            post_url: post.url,
            likesCount: post.engagement?.likes || 0,
            commentsCount: post.engagement?.replies || 0,
            images: post.images || [],
            platform: "twitter"
          },
          keywords: keywords.join(", "),
          prior_post_text: originalPostText,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed: ${res.status}`);
      }
      const data = await res.json();
      const comment: string = data.comment;
      setGeneratedComment(comment || "No comment generated");
      if (comment) toast.success("AI comment generated");
    } catch (e: any) {
      const msg = e?.message || "Failed to generate comment";
      setGenError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <li
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        padding: 12,
        background: "var(--card-bg)",
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <a
          href={post.url || "#"}
          target="_blank"
          rel="noreferrer"
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          X Post ↗

          {formattedDate && (
            <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>
              {formattedDate}
            </span>
          )}
        </a>

        {post.text && (
          <p
            style={{
              marginTop: 6,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              textWrap: "wrap",
              wordBreak: "break-word",
            }}
          >
            {post.text}
          </p>
        )}

        {/* Display images if available */}
        {post.images && post.images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: post.images.length > 1 ? "repeat(2, 1fr)" : "1fr",
              gap: 8,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {post.images.map((image: string, idx: number) => (
              <img
                key={idx}
                src={image}
                alt={`Tweet image ${idx + 1}`}
                width={100}
                height={100}
                style={{
                  objectFit: "cover",
                  borderRadius: 8,
                  background: "#f0f0f0",
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                }}
              />
            ))}
          </div>
        )}

        {post.author && (
          <div
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              padding: 12,
              background: "var(--card-bg)",
            }}
          >
            <h5 style={{ marginTop: 0, marginBottom: 10 }}>Author</h5>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {post.author.profile_image_url && (
                <img
                  src={post.author.profile_image_url}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#eee",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {post.author.name}{" "}
                  {post.author.verified && <span>✓</span>}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  @{post.author.username}
                </div>
              </div>
            </div>
          </div>
        )}

        {post.engagement && (
          <div
            style={{
              display: "flex",
              gap: 16,
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            {post.engagement.likes > 0 && <span>❤️ {post.engagement.likes}</span>}
            {post.engagement.retweets > 0 && (
              <span>🔄 {post.engagement.retweets}</span>
            )}
            {post.engagement.replies > 0 && (
              <span>💬 {post.engagement.replies}</span>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handleGenerateComment}
            disabled={isGenerating}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            title="Generate an AI comment for this post"
          >
            <span aria-hidden>✨</span>
            {isGenerating ? "Generating…" : "Generate Comment"}
          </button>
        </div>

        {genError && <div style={{ color: "crimson" }}>{genError}</div>}

        {generatedComment && (
          <div
            style={{
              border: "1px dashed var(--border-color)",
              borderRadius: 10,
              padding: 10,
              background: "var(--card-bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 600 }}>AI Comment</div>
              <button
                type="button"
                title="Copy comment"
                aria-label="Copy comment"
                onClick={() => {
                  if (generatedComment) {
                    navigator.clipboard.writeText(generatedComment);
                    toast.success("Comment copied");
                  }
                }}
                style={{
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>📋</span>
                Copy
              </button>
            </div>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {generatedComment}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}