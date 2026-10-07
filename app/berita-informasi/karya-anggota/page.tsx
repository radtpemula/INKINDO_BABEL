import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Karya Anggota - INKINDO BABEL",
  description: "Portofolio dan Dokumentasi Karya Perusahaan Konsultan Anggota INKINDO BABEL",
};

export default function KaryaAnggotaPage() {
  return (
    <PlaceholderLayout
      title="Karya Anggota"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Karya Anggota" },
      ]}
    />
  );
}
