import styles from "./placeholder.module.css";

export default function AddStudentPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Add New Student</h1>
        <p className={styles.phase}>Phase 4: Registration Flow</p>
        <div className={styles.message}>
          <p>This feature will be implemented in the upcoming phase.</p>
          <p className={styles.details}>
            Multi-step registration form with:<br />
            • Basic details<br />
            • Address information<br />
            • Contact details<br />
            • Education history<br />
            • Health information
          </p>
        </div>
        <a href="/admin/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}