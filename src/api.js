import { handlesLocal, localRequest } from './local-store.js';
import { handlesLocalApi, localApiRequest } from './local-api.js';
export class ApiError extends Error {constructor(message,{status=0,code='NETWORK_ERROR',details=null}={}){super(message);this.name='ApiError';this.status=status;this.code=code;this.details=details;}}
export async function request(endpoint,options={}){
  if(handlesLocal(endpoint)){try{return await localRequest(endpoint,options);}catch(error){if(error.name==='AbortError')throw error;throw new ApiError(error.message,{status:error.status??0,code:error.code??'BROWSER_STORAGE_ERROR',details:error.details??null});}}
  if(handlesLocalApi(endpoint)){try{return await localApiRequest(endpoint,options);}catch(error){if(error.name==='AbortError')throw error;throw new ApiError(error.message,{status:error.status??0,code:error.code??'LOCAL_API_ERROR',details:error.details??null});}}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  const relay=()=>controller.abort();if(options.signal?.aborted)controller.abort();options.signal?.addEventListener('abort',relay,{once:true});
  try{const r=await fetch('/api/v1'+endpoint,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
    if(r.status===204)return null;
    const data=await r.json().catch(()=>{throw new ApiError('服务返回无法读取，请重试。',{status:r.status,code:'INVALID_RESPONSE'})});
    
    if(!r.ok)throw new ApiError(data.error?.message||'操作暂未完成，请重试。',{status:r.status,code:data.error?.code,details:data.error?.details});return data;
  }catch(error){if(error instanceof ApiError)throw error;if(options.signal?.aborted)throw new DOMException('已取消过期请求','AbortError');if(error.name==='AbortError')throw new ApiError('在线服务响应超时。已保留你的输入，请重试。',{code:'TIMEOUT'});throw new ApiError('暂时无法连接在线服务。请检查网络后重试；当前输入已保留。');}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',relay);}
}
