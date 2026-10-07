import PlaceholderLayout from "@/components/PlaceholderLayout";

export const metadata = {
  title: "Login Mitra Kerja - INKINDO BABEL",
  description: "Portal Akses Masuk Mitra Kerja Terdaftar INKINDO BABEL",
};

export default function LoginMitraPage() {
  return (
    <PlaceholderLayout
      title="Login Mitra Kerja"
      category="Kemitraan"
      breadcrumbs={[
        { label: "Mitra Kerja" },
        { label: "Login Mitra Kerja" },
      ]}
    />
  );
}
