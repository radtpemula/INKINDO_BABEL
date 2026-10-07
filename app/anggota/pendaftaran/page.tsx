import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Pendaftaran Anggota Baru - INKINDO BABEL",
  description: "Prosedur dan Formulir Pendaftaran Anggota Baru DPP INKINDO Kepulauan Bangka Belitung",
};

export default function PendaftaranAnggotaPage() {
  return (
    <PlaceholderLayout
      title="Pendaftaran Anggota Baru"
      category="Keanggotaan"
      breadcrumbs={[
        { label: "Anggota" },
        { label: "Pendaftaran Anggota Baru" },
      ]}
    />
  );
}
