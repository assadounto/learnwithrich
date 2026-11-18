import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {categoryOf,categoryLabel,productHref} from '../lib/live-catalog.ts';
import {catalogFilters} from '../lib/catalog-filters.ts';
import {money,type Listing} from '../lib/xonbay/contracts.ts';
const code=ts.transpileModule(readFileSync(new URL('../components/business-home-catalog.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const exports:any={};
new Function('require','exports',code)((name:string)=>{
 if(name==='react/jsx-runtime')return jsxRuntime;
 if(name==='@/components/navigation-link')return {default:({children,...props}:any)=>createElement('a',props,children)};
 if(name==='@/lib/live-catalog')return {categoryOf,categoryLabel,productHref};
 if(name==='@/lib/xonbay/contracts')return {money};
 if(name==='./live-products')return {LiveProductCard:({item}:any)=>createElement('a',{href:productHref(item)},item.title)};
 return new Proxy({},{get:()=>()=>null});
},exports);
const base:Listing={id:1,public_id:'one',title:'Actual item',description:'Actual description',content_type:'article',category:'project',tags:['ESP32'],price_minor:0,currency:'GHS',cover_url:'https://example.com/cover.png',shop:{id:46,name:'LearnWithRich',handle:'learnwithrich'},checkout_pricing:{subtotal_minor:0,network_fee_minor:0,total_minor:0}};
const render=(items:Listing[],error=false)=>renderToStaticMarkup(createElement(exports.BusinessHomeCatalog,{items,error}));
test('home uses supplied published records for projects, reading and courses',()=>{
 const html=render([base,{...base,id:2,public_id:'two',title:'Actual guide',category:'guide'},{...base,id:3,public_id:'three',title:'Actual course',category:'course',content_type:'course'}]);
 for(const title of ['Actual item','Actual guide','Actual course'])assert.ok(html.includes(title));
 for(const href of ['/projects/one','/shop/two','/shop/three'])assert.ok(html.includes(href));
 assert.match(html,/PROJECT SPOTLIGHT/);assert.match(html,/https:\/\/example.com\/cover.png/);assert.doesNotMatch(html,/solar-hybrid-power-system|practical-maker|In preparation/);
});
test('empty and failed catalogs have honest messages and never create sample cards',()=>{
 assert.match(render([]),/as they’re published/);assert.doesNotMatch(render([]),/PROJECT SPOTLIGHT|href="\/shop\//);
 assert.match(render([base],true),/couldn’t load/);assert.doesNotMatch(render([base],true),/Actual item/);
 const guideOnly=render([{...base,category:'guide'}]);assert.doesNotMatch(guideOnly,/PROJECT SPOTLIGHT|All projects|All courses/);
});
test('home search and topic destinations initialise bounded catalog filters',()=>{
 assert.deepEqual(catalogFilters({q:'ESP32',category:'guide',tag:'Beginner'}),{query:'ESP32',category:'guide',tag:'Beginner'});
 assert.deepEqual(catalogFilters({topic:'Software',category:'unknown',q:['bad']}),{query:'Software',category:'all',tag:'all'});
 assert.equal(catalogFilters({q:'x'.repeat(300)}).query.length,200);
});
