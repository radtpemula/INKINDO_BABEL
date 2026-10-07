import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Galeri - INKINDO BABEL",
  description: "Dokumentasi Foto dan Video Kegiatan DPP INKINDO Kepulauan Bangka Belitung",
};

export default function GaleriPage() {
  return (
    <PlaceholderLayout
      title="Galeri"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Galeri" },
      ]}
    />
  );
}
