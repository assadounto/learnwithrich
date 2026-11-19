import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {courseProgress} from '../lib/dashboard.ts';
import {isFreeArticle,xonbayItemUrl,isProject,productHref,categoryLabel} from '../lib/live-catalog.ts';
import {imageUrl} from '../lib/account.ts';
function compile(path:string,imports:Record<string,unknown>={}){
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports:Record<string,React.ComponentType<any>>={};
 new Function('require','exports',code)((name:string)=>{
  if(name==='react/jsx-runtime')return jsxRuntime;
  if(name==='react')return React;
  if(name==='./purchase-product')return {PurchaseProduct:({freeLabel}:any)=>createElement('button',{},freeLabel||'Add to my library')};
  if(name==='lucide-react')return new Proxy({},{get:()=>()=>null});
  if(name in imports)return imports[name];
  throw Error(name);
 },exports);
 return exports;
}
test('project text renders headings, components and code while escaping HTML',()=>{
 const {GuideText}=compile('../components/guide-text.tsx');
 const text='## Components\n- LED\n- Resistor\n\n```cpp\ndigitalWrite(23, HIGH);\n```\n\n<script>alert(1)</script>';
 const html=renderToStaticMarkup(createElement(GuideText,{text}));
 assert.match(html,/<h3>Components<\/h3>/);assert.match(html,/<li>LED<\/li>/);assert.match(html,/<pre[^>]*><code>digitalWrite/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
});
test('article library cards offer both reading and attached downloads',()=>{
 const {CustomerLibrary}=compile('../components/customer-library.tsx',{
  '@/components/navigation-link':{default:({children,...props}:any)=>createElement('a',props,children)},
  '@/lib/dashboard':{courseProgress},'@/lib/account':{imageUrl}
 });
 const item={id:12,title:'LED Project',digital_product_public_id:'project',content_type:'article',accessible:true,files:[{id:1,filename:'led-code.ino'}]};
 const html=renderToStaticMarkup(createElement(CustomerLibrary,{items:[item]}));
 assert.match(html,/Read guide/);assert.match(html,/Download resource/);assert.match(html,/led-code.ino/);assert.match(html,/\/dashboard\/articles\/project/);
});

test('free guide renders its full public body and steps without a claim or checkout button',()=>{
 const {GuideText}=compile('../components/guide-text.tsx');
 const {PublicArticle}=compile('../components/public-article.tsx',{'./guide-text':{GuideText},'@/lib/live-catalog':{isFreeArticle}});
 const item={content_type:'article',price_minor:0,free_article:{body:'## Start here\nPublic reading',steps:[{id:'one',title:'Try it',body:'The full step'}]}};
 const html=renderToStaticMarkup(createElement(PublicArticle,{item}));
 assert.match(html,/Public reading/);assert.match(html,/The full step/);assert.doesNotMatch(html,/Add to my library|checkout|<button/);
 assert.equal(renderToStaticMarkup(createElement(PublicArticle,{item:{...item,price_minor:100}})),'');
});
test('related parts show real external shopping links and hide missing or invalid records',()=>{
 const {RelatedShopping}=compile('../components/related-shopping.tsx',{'@/lib/live-catalog':{xonbayItemUrl}});
 const html=renderToStaticMarkup(createElement(RelatedShopping,{item:{related_products:[{id:42,name:'ESP32 board',public_url:'javascript:bad'}],related_collections:[{id:12,name:'Sensor kit'},{id:'../bad',name:'Hidden'}]}}));
 assert.match(html,/https:\/\/www.xonbay.com\/products\/42/);assert.match(html,/https:\/\/www.xonbay.com\/collections\/12/);assert.match(html,/noopener noreferrer/);assert.doesNotMatch(html,/javascript:|Hidden/);
 assert.equal(renderToStaticMarkup(createElement(RelatedShopping,{item:{}})),'');
});

test('resource route displays free reading directly while paid guides keep checkout',async()=>{
 const {GuideText}=compile('../components/guide-text.tsx');
 const {PublicArticle}=compile('../components/public-article.tsx',{'./guide-text':{GuideText},'@/lib/live-catalog':{isFreeArticle}});
 let item:any={id:5,public_id:'guide',title:'Public guide',description:'Useful reading',category:'guide',content_type:'article',price_minor:0,currency:'GHS',free_article:{body:'Complete public text'},checkout_pricing:{network_fee_minor:0,total_minor:0}};
 class ServiceError extends Error{}
 const {default:Page}=compile('../app/(site)/shop/[id]/page.tsx',{
  '@/components/navigation-link':{default:({children,...props}:any)=>createElement('a',props,children)},
  'next/navigation':{notFound:()=>{throw Error('not found')},redirect:()=>{throw Error('redirect')}},
  '@/lib/xonbay/server':{listing:async()=>item,ServiceError},
  '@/lib/xonbay/contracts':{money:()=> 'GH₵1.00'},
  '@/lib/live-catalog':{isFreeArticle,isProject,productHref,categoryLabel},
  '@/components/public-article':{PublicArticle},
  '@/components/purchase-product':{PurchaseProduct:()=>createElement('button',{},'Checkout')}
 });
 const render=async()=>renderToStaticMarkup(await (Page as any)({params:Promise.resolve({id:'guide'})}));
 const free=await render();assert.match(free,/Complete public text/);assert.match(free,/Read the guide/);assert.doesNotMatch(free,/Checkout|Add to my library/);
 item={...item,price_minor:100,checkout_pricing:{network_fee_minor:0,total_minor:100}};
 const paid=await render();assert.match(paid,/Checkout/);assert.doesNotMatch(paid,/Complete public text/);
});
