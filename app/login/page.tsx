import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Login Anggota - INKINDO BABEL",
  description: "Portal Masuk Sistem Informasi Anggota INKINDO BABEL",
};

export default function LoginPage() {
  return (
    <PlaceholderLayout
      title="Login Anggota"
      breadcrumbs={[
        { label: "Login" },
      ]}
      description="Silakan masukkan kredensial akun anggota INKINDO BABEL Anda untuk mengakses layanan digital terintegrasi."
    />
  );
}
