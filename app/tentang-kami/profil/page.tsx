import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Profil INKINDO - INKINDO BABEL",
  description: "Profil Ikatan Nasional Konsultan Indonesia Provinsi Kepulauan Bangka Belitung",
};

export default function ProfilPage() {
  return (
    <PlaceholderLayout
      title="Profil INKINDO"
      category="Tentang Kami"
      breadcrumbs={[
        { label: "Tentang Kami" },
        { label: "Profil INKINDO" },
      ]}
    />
  );
}
