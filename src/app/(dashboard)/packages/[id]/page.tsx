import { PackageDetail } from "@/features/packages/package-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackageDetail id={id} />;
}
