import styles from "../signup.module.css";

type Props = {
  active: boolean;
  onClick: () => void;
};

export default function RenterCard({ active, onClick }: Props) {
  return (
    <div
      className={`${styles.signupCard} ${
        active ? styles.activeCard : ""
      }`}
      onClick={onClick}
    >
      <div className={styles.cardRadio}></div>

      <h3>I want to rent a property</h3>
      <p>Find homes and apartments easily</p>
    </div>
  );
}