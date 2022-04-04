import Link from 'next/link';
import Image from 'next/image';

import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a className={styles.headerContent}>
          <Image src="/logo.svg" alt="logo" width={238.62} height={25.63} />
        </a>
      </Link>
    </header>
  );
}
