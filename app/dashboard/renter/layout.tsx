import RenterHeader from "@/components/RenterHeader";

export default function RenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RenterHeader />
      {children}
    </>
  );
}