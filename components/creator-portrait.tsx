import Image from 'next/image';
import styles from './creator-portrait.module.css';

export function CreatorPortrait({variant = 'avatar'}: {variant?: 'portrait' | 'intro' | 'avatar'}) {
  return <Image src="/images/richmond-adu-kyere.jpeg" alt="Richmond Adu-Kyere" width={960} height={1280}
    sizes={variant === 'portrait' ? '(max-width: 700px) 90vw, 480px' : variant === 'intro' ? '(max-width: 580px) 90px, 200px' : '34px'}
    priority={variant === 'portrait'} className={`${styles.image} ${styles[variant]}`}/>;
}
