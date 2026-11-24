import styles from './creator-portrait.module.css';

export function CreatorPortrait({variant = 'avatar'}: {variant?: 'portrait' | 'intro' | 'avatar'}) {
  return <img src="/images/richmond-adu-kyere-192.webp" srcSet="/images/richmond-adu-kyere-192.webp 192w, /images/richmond-adu-kyere-576.webp 576w, /images/richmond-adu-kyere.jpeg 960w" decoding="async" alt="Richmond Adu-Kyere" width={960} height={1280}
    sizes={variant === 'portrait' ? '(max-width: 700px) 90vw, 480px' : variant === 'intro' ? '(max-width: 580px) 90px, 200px' : '34px'}
    fetchPriority={variant === 'portrait' ? 'high' : 'auto'} loading={variant === 'portrait' ? 'eager' : 'lazy'} className={`${styles.image} ${styles[variant]}`}/>;
}
