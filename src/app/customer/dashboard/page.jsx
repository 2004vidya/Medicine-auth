import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ClientDashboard from "./ClientDashboard";

export default async function Page(){
  const session = await getServerSession();


  if(!session){
    redirect("/auth");
  }

  return <ClientDashboard/>
}