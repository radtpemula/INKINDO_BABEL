import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Daftar Mitra Kerja - INKINDO BABEL",
  description: "Formulir Pendaftaran Program Kemitraan Bersama INKINDO Kepulauan Bangka Belitung",
};

export default function DaftarMitraPage() {
  return (
    <PlaceholderLayout
      title="Daftar Mitra Kerja"
      category="Kemitraan"
      breadcrumbs={[
        { label: "Mitra Kerja" },
        { label: "Daftar Mitra Kerja" },
      ]}
    />
  );
}
