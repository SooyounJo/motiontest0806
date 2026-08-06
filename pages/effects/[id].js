import Head from "next/head";
import Link from "next/link";
import { createEffectScene } from "@/components/webgl/EffectScene";
import { getEffectById } from "@/components/webgl/effects";
import PageLayout from "@/components/layout/PageLayout";
import styles from "@/styles/Home.module.css";

export default function EffectPage({ effect }) {
  if (!effect) {
    return (
      <div className={styles.gallery}>
        <p>Effect not found.</p>
        <Link href="/effects">Back to effects</Link>
      </div>
    );
  }

  const Scene = createEffectScene(effect.Scene);

  return (
    <>
      <Head>
        <title>{effect.title} — WebGL Lab</title>
        <meta name="description" content={effect.description} />
      </Head>
      <PageLayout
        overlay={
          <header className={styles.header}>
            <Link href="/effects" className={styles.back}>
              ← Effects
            </Link>
            <span className={styles.brand}>{effect.title}</span>
          </header>
        }
      >
        <Scene fullscreen />
      </PageLayout>
    </>
  );
}

export async function getStaticPaths() {
  const { effects } = await import("@/components/webgl/effects");
  return {
    paths: effects.map((e) => ({ params: { id: e.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const effect = getEffectById(params.id);
  if (!effect) {
    return { notFound: true };
  }
  return {
    props: {
      effect: {
        id: effect.id,
        title: effect.title,
        description: effect.description,
      },
    },
  };
}
