import OwnerHeader from "@/components/OwnerHeader";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OwnerHeader />
      {children}
    </>
  );
}