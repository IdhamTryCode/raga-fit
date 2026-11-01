import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}
