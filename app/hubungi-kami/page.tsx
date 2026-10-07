import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Hubungi Kami - INKINDO BABEL",
  description: "Kontak Resmi dan Lokasi Kantor Sekretariat DPP INKINDO Kepulauan Bangka Belitung",
};

export default function HubungiKamiPage() {
  return (
    <PlaceholderLayout
      title="Hubungi Kami"
      breadcrumbs={[
        { label: "Hubungi Kami" },
      ]}
      description="Hubungi sekretariat DPP INKINDO Provinsi Kepulauan Bangka Belitung melalui telepon, email, atau kunjungi kantor sekretariat kami di Pangkalpinang."
    />
  );
}
