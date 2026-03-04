import styles from "../signup.module.css";

type Props = {
  active: boolean;
  onClick: () => void;
};

export default function OwnerCard({ active, onClick }: Props) {
  return (
    <div
      className={`${styles.signupCard} ${
        active ? styles.activeCard : ""
      }`}
      onClick={onClick}
    >
      <div className={styles.cardRadio}></div>

      <h3>I want to list my property</h3>
      <p>Earn by renting your property</p>
    </div>
  );
}