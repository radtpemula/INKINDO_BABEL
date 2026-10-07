import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Struktur Organisasi - INKINDO BABEL",
  description: "Struktur Organisasi Dewan Pengurus Provinsi INKINDO Kepulauan Bangka Belitung",
};

export default function StrukturOrganisasiPage() {
  return (
    <PlaceholderLayout
      title="Struktur Organisasi"
      category="Tentang Kami"
      breadcrumbs={[
        { label: "Tentang Kami" },
        { label: "Struktur Organisasi" },
      ]}
    />
  );
}
