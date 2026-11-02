import { account, database, error, limitedBody, privateJson, validWrite } from "@/lib/store";

export async function GET(){
 const user=await account();
 if(!user)return error("Sign in to view your enquiries.",401);
 try{
  const result=await database().prepare("SELECT reference, name, email, organisation, plan, created_at AS createdAt FROM demo_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").bind(user.userId).all();
  return privateJson({enquiries:result.results});
 }catch(e){console.error("Enquiry read failed",e);return error("Your enquiries could not be loaded. Please try again.",503)}
}

export async function POST(request:Request){
 const user=await account();
 if(!user)return error("Sign in to save your enquiry.",401);
 if(!validWrite(request))return error("Please submit from the website.",403);
 try{
  const bytes=await limitedBody(request,20000);
  const data=JSON.parse(new TextDecoder().decode(bytes));
  const text=(key:string,max:number)=>typeof data[key]==="string"?data[key].trim().slice(0,max):"";
  const name=text("name",120),email=text("email",150),organisation=text("organisation",200),plan=text("plan",50).toLowerCase();
  if(!name||!organisation||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return error("Please enter your name, work email and organisation.");
  if(plan&&!['start','enterprise'].includes(plan))return error("Choose a valid plan.");
  const recent=await database().prepare("SELECT COUNT(*) AS count FROM demo_requests WHERE user_id = ? AND created_at > ?").bind(user.userId,Date.now()-3600000).first<{count:number}>();
  if((recent?.count??0)>=10)return error("Please try again later; the hourly enquiry limit has been reached.",429);
  const id=crypto.randomUUID(),reference="DEMO-"+id.replaceAll("-","").slice(0,12).toUpperCase();
  await database().prepare("INSERT INTO demo_requests (id, reference, user_id, name, email, organisation, venue_type, locations, process, message, plan, created_at) VALUES (?, ?, ?, ?, ?, ?, '', 0, '', '', ?, ?)").bind(id,reference,user.userId,name,email,organisation,plan,Date.now()).run();
  return privateJson({reference,status:"saved"},201);
 }catch(e){console.error("Enquiry save failed",e);return error("Your enquiry could not be saved. Your details are still here; please try again.",503)}
}
