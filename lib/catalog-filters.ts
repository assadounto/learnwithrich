const allowedCategories=new Set(['project','book','guide','illustration','course','resource']);
export function catalogFilters(params:Record<string,string|string[]|undefined>){
 const value=(key:string)=>typeof params[key]==='string'?params[key] as string:'';
 const category=value('category');
 return {query:(value('q')||value('topic')).slice(0,200),category:allowedCategories.has(category)?category:'all',tag:value('tag').slice(0,100)||'all'};
}
