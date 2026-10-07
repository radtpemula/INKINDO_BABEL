import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Klinik Konsultasi - INKINDO BABEL",
  description: "Layanan Konsultasi Teknis, Hukum Kontrak, dan Advokasi Anggota INKINDO BABEL",
};

export default function KlinikKonsultasiPage() {
  return (
    <PlaceholderLayout
      title="Klinik Konsultasi"
      breadcrumbs={[
        { label: "Klinik Konsultasi" },
      ]}
      description="Layanan konsultasi dan advokasi profesional bagi badan usaha anggota INKINDO Provinsi Kepulauan Bangka Belitung mengenai regulasi, kontrak kerja, dan teknis penyelenggaraan konsultansi."
    />
  );
}
