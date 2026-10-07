import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Live Streaming - INKINDO BABEL",
  description: "Siaran Langsung Acara, Webinar, dan Musyawarah INKINDO",
};

export default function LiveStreamingPage() {
  return (
    <PlaceholderLayout
      title="Live Streaming"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Live Streaming" },
      ]}
    />
  );
}
