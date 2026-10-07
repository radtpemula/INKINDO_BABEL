import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Anggota Terdaftar - INKINDO BABEL",
  description: "Direktori Perusahaan Konsultan Anggota Terdaftar DPP INKINDO Kepulauan Bangka Belitung",
};

export default function AnggotaTerdaftarPage() {
  return (
    <PlaceholderLayout
      title="Anggota Terdaftar"
      category="Keanggotaan"
      breadcrumbs={[
        { label: "Anggota" },
        { label: "Anggota Terdaftar" },
      ]}
    />
  );
}
