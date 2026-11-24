import {authoringExamples, authoringGuide, authoringSkillUrl} from '@/lib/authoring-skill';
import type {Metadata} from 'next';
import {ArrowRight, FileJson} from 'lucide-react';
import {editorHeadingKeys, resourceDefinitions} from '@/lib/resource-types';
import styles from './package-guide.module.css';

export const metadata: Metadata = {
  title: 'Resource ZIP format',
  description: 'Create a LearnWithRich resource ZIP with a JSON manifest, Markdown, and bundled files. Includes the v1 schema and sample manifests.',
  alternates: {canonical: '/resource-package'},
};

const schemaUrl = '/schemas/resource-package-v1.schema.json';
const exampleUrl = '/resource-package/examples';
const manifest = {
  format: 'learnwithrich-resource',
  version: 1,
  resources: [{
    key: 'garden-monitor',
    type: 'PROJECT',
    title: 'Build a garden monitor',
    slug: 'garden-monitor',
    summary: 'Read soil moisture and record the results.',
    bodyMarkdown: '## Setup\n\n![Wiring diagram](package-file:files/wiring.png)\n\n[Download the worksheet](package-file:files/worksheet.pdf)',
    cover: 'files/cover.png',
    attachments: [{path: 'files/worksheet.pdf', title: 'Worksheet'}],
    details: {difficulty: 'Beginner'},
  }],
};

export default function ResourcePackageGuide() {
  return <article className={`ref-container ${styles.guide}`}>
    <header className={styles.hero}>
      <span className="maker-kicker">CREATOR REFERENCE · VERSION 1</span>
      <h1>Resource ZIP format</h1>
      <p>Bundle a project, lesson, course, or learning path with its Markdown and files. Share the agent skill with ChatGPT, Claude, or another assistant to create ZIPs, draft project ideas, or publish approved work through the API.</p>
      <div className={styles.actions}>
        <a className="button button-dark" href={schemaUrl}><FileJson size={16}/>JSON schema</a>
        <a className="button button-outline" href={authoringSkillUrl}>Open SKILL.md <ArrowRight size={16}/></a>
      </div>
    </header>

    <div className={styles.layout}>
      <nav className={styles.contents} aria-label="On this page">
        <strong>On this page</strong>
        <a href="#agent-authoring">Agent skill and commands</a>
        <a href="#manifest">ZIP and manifest</a>
        <a href="#files">Files and links</a>
        <a href="#collections">Courses and paths</a>
        <a href="#fields">Resource fields</a>
        <a href="#import">Import and duplicates</a>
        <a href="#examples">Example manifests</a>
        <a href="#prompt">Prompt for an LLM</a>
      </nav>
      <div className={styles.content}>
        <section id="agent-authoring">
          <h2>Author with ChatGPT or Claude</h2>
          <p>Paste the prompt below into your assistant. It can create the ZIP or idea JSON locally and ask for a token when you request an upload. Generate a token in <a href="/admin/resource-api">Studio → Resource API</a> and select only the permissions for that job.</p>
          <p><a href={authoringSkillUrl}>Read the agent skill</a> or <a href={authoringSkillUrl} download="SKILL.md">download SKILL.md</a> for tools that install skills.</p>
          <pre><code>{`Read ${authoringGuide}/SKILL.md. Help me create [describe the resources or project ideas]. Ask for a scoped token only if I request an upload. Create drafts unless I explicitly ask you to publish specific items.`}</code></pre>
          <pre><code>{authoringExamples.setup}</code></pre>
          <details><summary>Build, preview, and import a resource ZIP</summary><pre><code>{authoringExamples.zip}</code></pre><pre><code>{authoringExamples.resources}</code></pre></details>
          <details><summary>Edit a resource draft</summary><pre><code>{authoringExamples.edit}</code></pre></details>
          <details><summary>Create project idea drafts</summary><pre><code>{authoringExamples.ideas}</code></pre></details>
          <details><summary>Publish a resource draft</summary><pre><code>{authoringExamples.publishResource}</code></pre></details>
          <details><summary>Publish a project idea draft</summary><pre><code>{authoringExamples.publishIdea}</code></pre></details>
        </section>
        <section id="manifest">
          <h2>ZIP and manifest</h2>
          <p>Put one <code>manifest.json</code> at the ZIP root. Assets go under <code>files/</code>. Use format <code>learnwithrich-resource</code>, version <code>1</code>, and a nonempty <code>resources</code> array. Each entry needs a unique lowercase hyphenated <code>key</code> and <code>slug</code>, plus a <code>type</code> and <code>title</code>.</p>
          <pre><code>{JSON.stringify(manifest, null, 2)}</code></pre>
        </section>
        <section id="files">
          <h2>Files and links</h2>
          <p>Use <code>files/wiring.png</code> for a local cover or attachment path. Use <code>package-file:files/wiring.png</code> in Markdown or URL fields in <code>details</code>. External links and covers can use HTTPS. Remote links stay external.</p>
          <p>Each referenced file must exist in the ZIP. The package limit is 100 MiB compressed, 250 MiB expanded, and 500 entries. Each media file can be up to 50 MiB and the manifest up to 2 MiB. Use standard ZIP store or deflate compression.</p>
        </section>
        <section id="collections">
          <h2>Courses and paths</h2>
          <p>Put the collection and its child resources in the same manifest. List children in order using <code>items</code>. Each item has a <code>resource</code> matching a package key and can specify a <code>section</code> matching a key in <code>sections</code>. Courses contain lessons. Paths can contain any resource type.</p>
        </section>
        <section id="fields">
          <h2>Resource fields</h2>
          <p>Use <code>summary</code>, <code>bodyMarkdown</code>, and <code>tags</code> for the resource content. Access defaults to <code>PUBLIC</code> and currency to <code>GHS</code>. <code>PAID</code> requires a positive <code>priceMinor</code>. <code>PUBLIC</code> and <code>FREE_ACCOUNT</code> require zero.</p>
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Fields by resource type">
            <table>
              <thead><tr><th scope="col">Type</th><th scope="col">Fields in details</th></tr></thead>
              <tbody>{Object.entries(resourceDefinitions).map(([type, definition]) => <tr key={type}><th scope="row"><code>{type}</code></th><td>{definition.fields.map(field => <code key={field.key}>{field.key}</code>)}</td></tr>)}</tbody>
            </table>
          </div>
          <details><summary>Optional editor section titles</summary><ul>{editorHeadingKeys.map(key => <li key={key}><code>{key}</code></li>)}</ul></details>
          <p>The <a href={schemaUrl}>JSON schema</a> lists the permitted values and field limits. The studio also checks file references, collection links, and readiness for publication.</p>
        </section>
        <section id="import">
          <h2>Import and duplicates</h2>
          <p>In the owner studio, open <strong>Resources → Import ZIP</strong> and review the preview. Import creates drafts and puts the referenced files in one folder under <strong>Files</strong>. The folder uses the resource title for a single resource or the ZIP name for a bundle.</p>
          <p>If any slug already exists, the whole import is blocked and existing drafts and files stay intact. Renaming the ZIP alone has no effect. To create a separate copy, give the conflicting resources new slugs in <code>manifest.json</code>.</p>
        </section>
        <section id="examples">
          <h2>Example manifests</h2>
          <p>Use these JSON examples as a starting point. Include any local files they reference when building the ZIP.</p>
          <ul>
            <li><a href={`${exampleUrl}/single-project.json`}>Single project</a></li>
            <li><a href={`${exampleUrl}/course-bundle.json`}>Course with lessons</a></li>
            <li><a href={`${exampleUrl}/all-resource-types.json`}>All supported resource types</a></li>
          </ul>
        </section>
        <section id="prompt">
          <h2>Prompt for an LLM</h2>
          <pre className={styles.prompt}><code>{'Create a LearnWithRich resource ZIP for [describe the resource]. Follow https://learnwithrich.com/resource-package and validate manifest.json against the linked v1 schema. Include every referenced local file under files/. Use unique resource slugs and return the finished ZIP.'}</code></pre>
        </section>
      </div>
    </div>
  </article>;
}
