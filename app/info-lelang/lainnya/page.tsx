import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Lelang Lainnya - INKINDO BABEL",
  description: "Informasi Lelang Swasta, BUMN, dan Lembaga Lainnya",
};

export default function LelangLainnyaPage() {
  return (
    <PlaceholderLayout
      title="Lelang Lainnya"
      category="Info Lelang"
      breadcrumbs={[
        { label: "Info Lelang" },
        { label: "Lainnya" },
      ]}
    />
  );
}
