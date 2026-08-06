import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import PageLayout from "@/components/layout/PageLayout";
import { effects } from "@/components/webgl/effects";
import styles from "@/styles/Home.module.css";

const IridescentRingScene = dynamic(
  () =>
    import("@/components/webgl/effects/iridescentRing/IridescentRingScene"),
  { ssr: false }
);

export default function Home() {
  const featured = effects[0];

  return (
    <>
      <Head>
        <title>WebGL Lab — {featured?.title ?? "Home"}</title>
        <meta
          name="description"
          content="WebGL experiments on a black canvas — shareable effect pages."
        />
      </Head>
      <PageLayout
        overlay={
          <header className={styles.header}>
            <span className={styles.brand}>WebGL Lab</span>
            <nav className={styles.nav}>
              <Link href="/effects">Effects</Link>
            </nav>
          </header>
        }
      >
        <IridescentRingScene fullscreen />
      </PageLayout>
    </>
  );
}
