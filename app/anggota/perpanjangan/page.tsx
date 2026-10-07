import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Perpanjangan Anggota - INKINDO BABEL",
  description: "Layanan Perpanjangan Kartu Tanda Anggota (KTA) INKINDO BABEL",
};

export default function PerpanjanganAnggotaPage() {
  return (
    <PlaceholderLayout
      title="Perpanjangan Anggota"
      category="Keanggotaan"
      breadcrumbs={[
        { label: "Anggota" },
        { label: "Perpanjangan Anggota" },
      ]}
    />
  );
}
