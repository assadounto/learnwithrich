import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {courseProgress} from '../lib/dashboard.ts';
import {imageUrl} from '../lib/account.ts';
function compile(path:string,imports:Record<string,unknown>={}){
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports:Record<string,React.ComponentType<any>>={};
 new Function('require','exports',code)((name:string)=>{
  if(name==='react/jsx-runtime')return jsxRuntime;
  if(name==='react')return React;
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
