import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Regulasi INKINDO - INKINDO BABEL",
  description: "Daftar Regulasi dan Ketentuan Internal INKINDO",
};

export default function RegulasiInkindoPage() {
  return (
    <PlaceholderLayout
      title="Regulasi INKINDO"
      category="Regulasi"
      breadcrumbs={[
        { label: "Regulasi" },
        { label: "Regulasi INKINDO" },
      ]}
    />
  );
}
