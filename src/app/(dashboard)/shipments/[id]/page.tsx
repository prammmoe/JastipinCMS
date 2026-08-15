import { ShipmentDetail } from "@/features/shipments/shipment-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ShipmentDetail id={id}/>}

