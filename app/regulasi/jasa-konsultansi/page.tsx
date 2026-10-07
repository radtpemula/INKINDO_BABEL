import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Regulasi Jasa Konsultansi - INKINDO BABEL",
  description: "Daftar Regulasi Terkait Praktik dan Penyelenggaraan Jasa Konsultansi",
};

export default function RegulasiJasaKonsultansiPage() {
  return (
    <PlaceholderLayout
      title="Regulasi Jasa Konsultansi"
      category="Regulasi"
      breadcrumbs={[
        { label: "Regulasi" },
        { label: "Regulasi Jasa Konsultansi" },
      ]}
    />
  );
}
