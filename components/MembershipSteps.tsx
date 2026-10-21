import ProcessStepsSection from "./ProcessStepsSection";
import { membershipSteps } from "@/data/landing";

export default function MembershipSteps() {
  return (
    <ProcessStepsSection
      id="membership-steps"
      badge="Panduan Registrasi"
      title="Langkah-Langkah Pendaftaran Menjadi Anggota"
      description="Proses pendaftaran keanggotaan baru INKINDO BABEL dirancang transparan, terstruktur, dan berbasis digital untuk kemudahan badan usaha jasa konsultansi di Kepulauan Bangka Belitung."
      steps={membershipSteps}
      backgroundClass="bg-white"
      paddingClass="py-20 sm:py-24 xl:py-28"
      ctaText="Mulai Pendaftaran Anggota Baru Sekarang"
      ctaHref="#hero"
    />
  );
}
