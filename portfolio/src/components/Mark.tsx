export function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`mark${small ? " mark-small" : ""}`} aria-hidden="true">
      NJ
    </span>
  );
}
