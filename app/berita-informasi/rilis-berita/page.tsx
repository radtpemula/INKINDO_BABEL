import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Rilis Berita - INKINDO BABEL",
  description: "Rilis Berita Resmi DPP INKINDO Kepulauan Bangka Belitung",
};

export default function RilisBeritaPage() {
  return (
    <PlaceholderLayout
      title="Rilis Berita"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Rilis Berita" },
      ]}
    />
  );
}
