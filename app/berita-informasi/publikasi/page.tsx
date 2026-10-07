import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Publikasi - INKINDO BABEL",
  description: "Dokumen Publikasi Ilmiah, Laporan Tahunan, dan Press Release INKINDO",
};

export default function PublikasiPage() {
  return (
    <PlaceholderLayout
      title="Publikasi"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Publikasi" },
      ]}
    />
  );
}
