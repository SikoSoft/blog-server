export function pad(x: number, padding: number = 2): string {
  return x.toString().padStart(padding, "0");
}

export function arrayUnique(array: any): any {
  return [...new Set(array.map((element) => JSON.stringify(element)))].map(
    (element: any) => JSON.parse(element)
  );
}

export function shortDate(time: Date = new Date()): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export const getTextFromDelta = (delta): any => {
  return delta.reduce((accumulator, op) => {
    if (typeof op.insert === "string") {
      return accumulator + op.insert;
    }
  }, "");
};

export function sanitizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
