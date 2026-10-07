import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Regulasi Terkait - INKINDO BABEL",
  description: "Undang-Undang, Peraturan Pemerintah, dan Regulasi Terkait Jasa Konstruksi dan Non-Konstruksi",
};

export default function RegulasiTerkaitPage() {
  return (
    <PlaceholderLayout
      title="Regulasi Terkait"
      category="Regulasi"
      breadcrumbs={[
        { label: "Regulasi" },
        { label: "Regulasi Terkait" },
      ]}
    />
  );
}
