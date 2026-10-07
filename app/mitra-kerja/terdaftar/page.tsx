import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Mitra Kerja Terdaftar - INKINDO BABEL",
  description: "Daftar Mitra Kerja Terverifikasi DPP INKINDO Kepulauan Bangka Belitung",
};

export default function MitraTerdaftarPage() {
  return (
    <PlaceholderLayout
      title="Mitra Kerja Terdaftar"
      category="Kemitraan"
      breadcrumbs={[
        { label: "Mitra Kerja" },
        { label: "Mitra Kerja Terdaftar" },
      ]}
    />
  );
}
