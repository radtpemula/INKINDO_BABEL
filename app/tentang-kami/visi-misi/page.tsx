import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Visi & Misi - INKINDO BABEL",
  description: "Visi dan Misi Ikatan Nasional Konsultan Indonesia Provinsi Kepulauan Bangka Belitung",
};

export default function VisiMisiPage() {
  return (
    <PlaceholderLayout
      title="Visi & Misi"
      category="Tentang Kami"
      breadcrumbs={[
        { label: "Tentang Kami" },
        { label: "Visi & Misi" },
      ]}
    />
  );
}
