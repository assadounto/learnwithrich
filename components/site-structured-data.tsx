const siteUrl = 'https://learnwithrich.com';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'LearnWithRich',
      description: 'Practical projects, useful resources, books, illustrations and courses by Richmond Adu-Kyere.',
      inLanguage: 'en',
      publisher: {'@id': `${siteUrl}/#organization`},
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#richmond`,
      name: 'Richmond Adu-Kyere',
      url: `${siteUrl}/about`,
      image: `${siteUrl}/images/richmond-adu-kyere.jpeg`,
      jobTitle: 'Software and electronics engineer',
      sameAs: ['https://github.com/assadounto'],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'LearnWithRich',
      url: siteUrl,
      founder: {'@id': `${siteUrl}/#richmond`},
    },
  ],
};

export function SiteStructuredData() {
  const json = JSON.stringify(structuredData).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />;
}
