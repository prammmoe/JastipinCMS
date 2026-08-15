import { EntityDetail } from "@/features/shared/entity-detail";
export default async function DetailPage({params}:{params:Promise<{section:string;id:string}>}){const {section,id}=await params;return <EntityDetail section={section} id={id}/>}

