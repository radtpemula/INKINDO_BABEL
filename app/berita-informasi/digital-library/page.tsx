import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Digital Library - INKINDO BABEL",
  description: "Perpustakaan Digital Literatur Teknik, Modul, dan Referensi Konsultansi",
};

export default function DigitalLibraryPage() {
  return (
    <PlaceholderLayout
      title="Digital Library"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Digital Library" },
      ]}
    />
  );
}
