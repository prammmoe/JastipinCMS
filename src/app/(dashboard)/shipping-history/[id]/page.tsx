import { ShippingHistoryDetail } from "@/features/shipping-history/shipping-history-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShippingHistoryDetail id={id} />;
}