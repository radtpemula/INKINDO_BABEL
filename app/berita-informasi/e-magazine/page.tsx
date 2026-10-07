import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "e-Magazine - INKINDO BABEL",
  description: "Majalah Digital dan Buletin Berkala INKINDO",
};

export default function EMagazinePage() {
  return (
    <PlaceholderLayout
      title="e-Magazine"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "e-Magazine" },
      ]}
    />
  );
}
