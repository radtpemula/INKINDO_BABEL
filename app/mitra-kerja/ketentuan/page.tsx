import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Ketentuan Mitra Kerja - INKINDO BABEL",
  description: "Syarat dan Ketentuan Kemitraan Strategis Bersama INKINDO Kepulauan Bangka Belitung",
};

export default function KetentuanMitraPage() {
  return (
    <PlaceholderLayout
      title="Ketentuan Mitra Kerja"
      category="Kemitraan"
      breadcrumbs={[
        { label: "Mitra Kerja" },
        { label: "Ketentuan Mitra Kerja" },
      ]}
    />
  );
}
