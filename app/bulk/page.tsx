import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BulkGenerator from "@/components/BulkGenerator";

export const metadata = {
  title: "Bulk Generator — QRForge",
  description:
    "Generate up to 100 QR codes at once from a CSV file. Download the entire batch as a ZIP archive.",
};

export default function BulkPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />
      <main className="flex-1">
        <BulkGenerator />
      </main>
      <Footer />
    </div>
  );
}
