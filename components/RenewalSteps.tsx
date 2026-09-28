import ProcessStepsSection from "./ProcessStepsSection";
import { renewalSteps } from "@/data/landing";

export default function RenewalSteps() {
  return (
    <ProcessStepsSection
      id="renewal-steps"
      badge="Layanan Anggota"
      title="Langkah-Langkah Perpanjangan Anggota"
      description="Perbarui masa aktif Kartu Tanda Anggota (KTA) perusahaan Anda secara praktis tanpa harus datang langsung ke kantor sekretariat."
      steps={renewalSteps}
      backgroundClass="bg-white"
      ctaText="Masuk ke Portal Perpanjangan KTA"
      ctaHref="#hero"
    />
  );
}
