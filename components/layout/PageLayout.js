import styles from "./PageLayout.module.css";

export default function PageLayout({ children, overlay = null }) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>{children}</main>
      {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
    </div>
  );
}
