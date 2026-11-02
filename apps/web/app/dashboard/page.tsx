
import Link from "next/link";
import { Dashboard } from "@/components/site/product";
export const metadata={title:"Interactive product preview"};
export default function DashboardPage(){return <main id="main" className="dashboard-page"><div className="wrap"><div className="preview-toolbar"><div><strong>Product preview</strong><br/>Illustrative records · explore search, filters and the return journey.</div><Link className="text-link" href="/report">Try reporting</Link></div><Dashboard interactive/><div className="readiness"><h3>A concept you can explore</h3><p>Use search and filters or open an item to simulate a private match and owner-confirmed return. Sample changes reset on reload. Live organisation analytics and staff access are planned.</p></div></div></main>}
