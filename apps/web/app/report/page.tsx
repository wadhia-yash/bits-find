
import Link from "next/link";
import { ReportForm } from "@/components/site/forms";
import { Eyebrow } from "@/components/site/home";
export const metadata={title:"Report a lost item"};
export default async function ReportPage({searchParams}:{searchParams:Promise<{venue?:string}>}){const {venue}=await searchParams;return <main id="main"><div className="wrap form-layout"><div className="form-heading"><Eyebrow>Reporting pilot</Eyebrow><h1>Lost something?<br/>Let&apos;s find a way.</h1><p>Start with the details. What it was, where you were and what someone might recognise.</p><div className="form-context"><strong>A private website pilot</strong>Your report saves to your signed-in account. It is separate from the campus mobile app and isn&apos;t sent to venue teams. Contact the venue&apos;s official desk for an active search.</div><div className="button-row"><Link className="text-link" href="/my-reports">My saved reports</Link><Link className="text-link" href="/resources/reporting-guide">Reporting guide</Link></div></div><ReportForm venue={venue}/></div></main>}
