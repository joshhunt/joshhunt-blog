export function FormattedDate({ date }: { date: string }) {
  const formattedDate = new Date(date).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return <time dateTime={date}>{formattedDate}</time>;
}
