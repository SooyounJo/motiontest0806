import Head from "next/head";
import Link from "next/link";
import { effects } from "@/components/webgl/effects";
import styles from "@/styles/Home.module.css";

export default function EffectsIndexPage() {
  return (
    <>
      <Head>
        <title>Effects — WebGL Lab</title>
      </Head>
      <div className={styles.gallery}>
        <Link href="/" className={styles.back}>
          ← Home
        </Link>
        <h1>Effects</h1>
        <p>Each effect has its own URL for sharing and embedding later.</p>
        <ul className={styles.list}>
          {effects.map((effect) => (
            <li key={effect.id}>
              <Link href={`/effects/${effect.id}`} className={styles.card}>
                <p className={styles.cardTitle}>{effect.title}</p>
                <p className={styles.cardDesc}>{effect.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
