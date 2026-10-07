import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "DPN INKINDO - INKINDO BABEL",
  description: "Informasi dan Koordinasi Dewan Pengurus Nasional (DPN) INKINDO",
};

export default function DpnInkindoPage() {
  return (
    <PlaceholderLayout
      title="DPN INKINDO"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "DPN INKINDO" },
      ]}
    />
  );
}
