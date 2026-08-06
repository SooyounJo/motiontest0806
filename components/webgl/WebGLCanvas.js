import styles from "./WebGLCanvas.module.css";

/**
 * Full-viewport (or contained) WebGL canvas shell.
 */
export default function WebGLCanvas({
  canvasRef,
  className = "",
  fullscreen = true,
  ...props
}) {
  const rootClass = [
    styles.root,
    fullscreen ? styles.fullscreen : styles.contained,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <canvas ref={canvasRef} className={styles.canvas} {...props} />
    </div>
  );
}
