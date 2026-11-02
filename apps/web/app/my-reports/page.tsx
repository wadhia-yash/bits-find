
import Link from "next/link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { MyReports } from "@/components/site/forms";
import { Eyebrow } from "@/components/site/home";
export const dynamic="force-dynamic";
export const metadata={title:"My reports and enquiries"};
export default async function ReportsPage(){const user=await requireChatGPTUser("/my-reports");return <main id="main"><section className="section"><div className="wrap"><Eyebrow>Your private pilot workspace</Eyebrow><div className="section-title-row" style={{marginTop:30}}><div><h1 className="section-heading">Your reports.<br/>One place.</h1><p className="field-help" style={{marginTop:20}}>{user.displayName}</p></div><Link className="button ink" href="/report">Report a lost item</Link></div><MyReports/></div></section></main>}
