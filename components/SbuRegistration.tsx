import ProcessStepsSection from "./ProcessStepsSection";
import { sbuSteps } from "@/data/landing";

export default function SbuRegistration() {
  return (
    <ProcessStepsSection
      id="sbu-steps"
      badge="Layanan Sertifikasi"
      title="Langkah-Langkah Pendaftaran SBU"
      description="Mekanisme pengajuan Sertifikat Badan Usaha (SBU) Jasa Konsultansi Konstruksi yang terintegrasi dengan Lembaga Sertifikasi Badan Usaha (LSBU) dan LPJK PUPR."
      steps={sbuSteps}
      backgroundClass="bg-[#F8FAFC]"
      ctaText="Konsultasi Persyaratan SBU Konstruksi"
      ctaHref="#hero"
    />
  );
}
