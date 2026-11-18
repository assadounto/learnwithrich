import {test} from 'node:test';
import assert from 'node:assert/strict';
import {categoryOf,categoryLabel,filterListings,isProject,productHref,topicTags,projectDetails} from '../lib/live-catalog.ts';
import type {Listing} from '../lib/xonbay/contracts.ts';
const base={id:5,public_id:'21ed1c12-cc41-413e-bde2-261ec6d50c0b',title:'First LED',description:'Build a useful light',content_type:'article',price_minor:0,currency:'GHS',cover_url:null,shop:{id:46,name:'LearnWithRich',handle:'learnwithrich'},checkout_pricing:{subtotal_minor:0,network_fee_minor:0,total_minor:0}} satisfies Listing;
const project:Listing={...base,tags:['Project','ESP32','Sensors'],project_details:{difficulty:'Beginner',tools:['Arduino IDE']}};
test('legacy Project tags become projects without treating every article as a project',()=>{assert.ok(isProject(project));assert.equal(categoryOf(base),'guide');assert.equal(productHref(project),'/projects/'+base.public_id);assert.equal(productHref(base),'/shop/'+base.public_id);assert.equal(categoryOf({...project,category:'book'}),'book');assert.equal(categoryOf({...project,category:'resource'}),'resource');});
test('category, topic, difficulty, price and search filters intersect',()=>{const paid={...base,id:6,category:'project',price_minor:1500,tags:['Sensors'],project_details:{difficulty:'Advanced' as const}};const items=[project,paid,{...base,category:'book'}];assert.equal(filterListings(items,'arduino','project','esp32','Beginner','free').length,1);assert.equal(filterListings(items,'','project','Sensors','Advanced','paid').length,1);assert.equal(filterListings(items,'','book','ESP32').length,0);});
test('topic choices omit category marker and deduplicate case',()=>{assert.deepEqual(topicTags([project,{...base,tags:['esp32','Power systems']}]),['ESP32','Power systems','Sensors']);});

test('legacy free component lists are shown without inventing quantities or leaking paid bodies',()=>{
 const older={...project,free_article:{body:'## Components\n- ESP32 board\n- Red LED\n\nUse a resistor.\n## Build\n- Not a component'}};
 assert.deepEqual(projectDetails(older).components,[{name:'ESP32 board'},{name:'Red LED'}]);
 assert.equal(projectDetails(project).components,undefined);
 const components=[{name:'Confirmed board',quantity:'1'}];assert.deepEqual(projectDetails({...older,project_details:{components}}).components,components);
});

test('public cards show discovery categories instead of delivery formats',()=>{assert.equal(categoryLabel(project),'Project');assert.equal(categoryLabel({...base,category:'project'}),'Project');assert.equal(categoryLabel({...base,category:'book'}),'Book');assert.equal(categoryLabel(base),'Guide');});
