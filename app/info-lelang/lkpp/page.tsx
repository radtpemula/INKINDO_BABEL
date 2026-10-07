import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Lelang LKPP - INKINDO BABEL",
  description: "Informasi Lelang dan Pengadaan Pemerintah Melalui Portal LKPP / SPSE",
};

export default function LelangLkppPage() {
  return (
    <PlaceholderLayout
      title="Lelang LKPP"
      category="Info Lelang"
      breadcrumbs={[
        { label: "Info Lelang" },
        { label: "LKPP" },
      ]}
    />
  );
}
