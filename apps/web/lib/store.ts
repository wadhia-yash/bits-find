import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export function database(){if(!env.DB)throw new Error("Report storage is unavailable");return env.DB}
export function photos(){if(!env.BUCKET)throw new Error("Photo storage is unavailable");return env.BUCKET}
export async function account(){return getChatGPTUser()}
export function error(message:string,status=400){return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}})}
export function privateJson(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}})}
export function validWrite(request:Request){return request.headers.get("sec-fetch-site")!=="cross-site"}
export const venueTypes=["University","Cinema","Mall","Hotel","Event / venue","Corporate campus","Other"];
export const categories=["Electronics","Wallets","Bags","Keys","ID / bank card","Clothing","Other"];
export function field(data:FormData,key:string,max=200){const value=data.get(key);return typeof value==="string"?value.trim().slice(0,max):""}
export async function limitedBody(request:Request,limit:number){if(Number(request.headers.get("content-length")??0)>limit)throw new Error("Submission too large");const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let length=0;while(true){const{done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new Error("Submission too large")}chunks.push(value)}const output=new Uint8Array(length);let offset=0;for(const c of chunks){output.set(c,offset);offset+=c.length}return output}
