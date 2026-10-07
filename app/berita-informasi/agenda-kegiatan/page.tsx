import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Agenda Kegiatan - INKINDO BABEL",
  description: "Jadwal dan Agenda Kegiatan DPP INKINDO Kepulauan Bangka Belitung",
};

export default function AgendaKegiatanPage() {
  return (
    <PlaceholderLayout
      title="Agenda Kegiatan"
      category="Berita & Informasi"
      breadcrumbs={[
        { label: "Berita & Informasi" },
        { label: "Agenda Kegiatan" },
      ]}
    />
  );
}
